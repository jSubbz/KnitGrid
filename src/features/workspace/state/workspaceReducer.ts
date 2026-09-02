/**
 * The row engine.
 *
 * Both axes are stored in the order the work happens: row 0 is the cast-on row
 * and cell 0 is the first stitch of that row. Knitting runs bottom-to-top and
 * right-to-left, so the renderer flips both axes; nothing in here needs to know
 * about that.
 *
 * A row is finished when it has consumed every live stitch the row below handed
 * up. Reaching that point creates the next row automatically. Turning early
 * marks the row short. Consuming more than is available is refused unless the
 * caller forces it, which flags the row instead.
 */
import { DEFAULT_STITCH, getStitch } from "../../stitches/stitches";
import { clampCastOn, createProject } from "../../project/projectFactory";
import {
  consumedBy,
  createRow,
  liveCountFor,
} from "../../project/rowMath";
import type {
  Cursor,
  KnitMode,
  KnitProject,
  PatternRow,
  RowAnchor,
  SelectionRect,
  WorkspaceMode,
} from "../../project/types";

export type YarnField =
  | "stitchesPerInch"
  | "rowsPerInch"
  | "yarnName"
  | "yarnDescriptors"
  | "patternTags";

export type CascadeChoice = "flag" | "pad" | "clear";

export type WorkspaceAction =
  | { type: "SET_YARN_FIELD"; field: YarnField; value: string }
  | { type: "SET_NOTES"; value: string }
  | { type: "SET_CAST_ON"; value: number }
  | { type: "SET_KNIT_MODE"; mode: KnitMode }
  | { type: "SET_WORKSPACE_MODE"; mode: WorkspaceMode }
  | { type: "SET_ANCHOR"; anchor: RowAnchor }
  | { type: "TOGGLE_MIRROR_X" }
  | { type: "TOGGLE_MIRROR_Y" }
  | { type: "CLEAR_MIRRORS" }
  | { type: "MOVE_CURSOR"; dir: "left" | "right" | "up" | "down" }
  | { type: "SET_CURSOR"; cursor: Cursor }
  | { type: "NEXT_ROW" }
  | { type: "TURN_WORK" }
  | { type: "PAINT_AND_ADVANCE"; stitch: string; force?: boolean }
  | { type: "ERASE_AND_BACKSPACE" }
  | { type: "SET_ROW_NOTE"; row: number; note: string }
  | { type: "CLEAR_SELECTION" }
  | { type: "EXTEND_SELECTION"; dir: "left" | "right" | "up" | "down" }
  | { type: "CAPTURE_MOTIF" }
  | { type: "SET_DESTINATION_FROM_SELECTION" }
  | { type: "CLEAR_DESTINATION" }
  | { type: "TILE_DESTINATION"; cascade: CascadeChoice };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function cloneRows(rows: PatternRow[]): PatternRow[] {
  return rows.map((row) => ({ ...row, cells: row.cells.map((c) => ({ ...c })) }));
}

/** Rows only ever grow at the top, one at a time, as the work reaches them. */
function withRowAt(rows: PatternRow[], index: number): PatternRow[] {
  if (rows[index]) return rows;
  const next = [...rows];
  while (next.length <= index) next.push(createRow());
  return next;
}

function clearSelectionState(project: KnitProject): KnitProject {
  return {
    ...project,
    selection: {
      ...project.selection,
      active: false,
      anchor: null,
      focus: null,
      rect: null,
    },
  };
}

function buildRect(a: Cursor, b: Cursor): SelectionRect {
  return {
    minRow: Math.min(a.row, b.row),
    maxRow: Math.max(a.row, b.row),
    minIndex: Math.min(a.index, b.index),
    maxIndex: Math.max(a.index, b.index),
  };
}

function rowLength(project: KnitProject, row: number): number {
  return project.rows[row]?.cells.length ?? 0;
}

function clampCursor(project: KnitProject, cursor: Cursor): Cursor {
  const row = clamp(cursor.row, 0, Math.max(0, project.rows.length - 1));
  return { row, index: clamp(cursor.index, 0, rowLength(project, row)) };
}

export function workspaceReducer(
  state: KnitProject,
  action: WorkspaceAction
): KnitProject {
  switch (action.type) {
    case "SET_YARN_FIELD":
      return { ...state, yarn: { ...state.yarn, [action.field]: action.value } };

    case "SET_NOTES":
      return { ...state, notes: action.value };

    case "SET_CAST_ON":
      return { ...state, castOn: clampCastOn(action.value) };

    case "SET_KNIT_MODE":
      return { ...state, knitMode: action.mode };

    case "SET_WORKSPACE_MODE":
      return { ...state, workspaceMode: action.mode };

    case "SET_ANCHOR":
      return { ...state, anchor: action.anchor };

    case "TOGGLE_MIRROR_X":
      return { ...state, mirrorX: !state.mirrorX };

    case "TOGGLE_MIRROR_Y":
      return { ...state, mirrorY: !state.mirrorY };

    case "CLEAR_MIRRORS":
      return { ...state, mirrorX: false, mirrorY: false };

    case "SET_CURSOR":
      return clearSelectionState({
        ...state,
        cursor: clampCursor(state, action.cursor),
      });

    case "MOVE_CURSOR": {
      const { row, index } = state.cursor;
      let next: Cursor = { row, index };

      if (action.dir === "left") next = { row, index: index + 1 };
      if (action.dir === "right") next = { row, index: index - 1 };
      if (action.dir === "up") next = { row: row + 1, index };
      if (action.dir === "down") next = { row: row - 1, index };

      return clearSelectionState({ ...state, cursor: clampCursor(state, next) });
    }

    case "PAINT_AND_ADVANCE": {
      const arriving = getStitch(action.stitch);
      const atRow = state.cursor.row;
      const atRowLive = liveCountFor(state, atRow);
      const atRowRow = state.rows[atRow];
      const atRowConsumed = atRowRow ? consumedBy(atRowRow) : 0;

      // A consuming stitch landing on a row that has already used up its live
      // stitches belongs to the next row. A zero-consume stitch does not: rows
      // routinely end on an increase, so it stays here.
      const rollOver =
        arriving.consumes > 0 &&
        atRowConsumed >= atRowLive &&
        (atRowRow?.cells.length ?? 0) > 0;

      const rowIndex = rollOver ? atRow + 1 : atRow;
      const rows = withRowAt(cloneRows(state.rows), rowIndex);
      const row = rows[rowIndex];
      const cursorIndex = rollOver ? row.cells.length : state.cursor.index;

      // Replacing an existing cell frees whatever it consumed, so measure the
      // overflow against the row as it will be, not as it is.
      const replacing = row.cells[cursorIndex];
      const freed = replacing ? getStitch(replacing.stitch).consumes : 0;
      const live = rollOver ? liveCountFor(state, rowIndex) : atRowLive;
      const after = consumedBy(row) - freed + arriving.consumes;

      if (after > live && !action.force) return state;

      if (replacing) {
        row.cells[cursorIndex] = { stitch: action.stitch };
      } else {
        row.cells.push({ stitch: action.stitch });
      }

      return clearSelectionState({
        ...state,
        rows,
        cursor: { row: rowIndex, index: cursorIndex + 1 },
      });
    }

    case "NEXT_ROW": {
      const rowIndex = state.cursor.row;
      const row = state.rows[rowIndex];

      // Refused while stitches are still live. Turning early is a real thing to
      // do, but it reshapes everything above, so it must be asked for on
      // purpose rather than fall out of a stray Enter.
      if (row && row.cells.length > 0 && consumedBy(row) < liveCountFor(state, rowIndex)) {
        return state;
      }

      const rows = withRowAt(cloneRows(state.rows), rowIndex + 1);
      return clearSelectionState({
        ...state,
        rows,
        cursor: { row: rowIndex + 1, index: 0 },
      });
    }

    case "TURN_WORK": {
      const rowIndex = state.cursor.row;
      const rows = cloneRows(state.rows);
      const row = rows[rowIndex];
      if (!row || row.cells.length === 0) return state;

      row.short = consumedBy(row) < liveCountFor(state, rowIndex);

      const grown = withRowAt(rows, rowIndex + 1);
      return clearSelectionState({
        ...state,
        rows: grown,
        cursor: { row: rowIndex + 1, index: 0 },
      });
    }

    case "ERASE_AND_BACKSPACE": {
      const rows = cloneRows(state.rows);
      const { row, index } = state.cursor;

      if (index > 0) {
        rows[row].cells.splice(index - 1, 1);
        return clearSelectionState({
          ...state,
          rows,
          cursor: { row, index: index - 1 },
        });
      }

      if (row > 0) {
        // Stepping off the start of a row drops it if nothing was worked there
        // and it is the topmost row, so backspacing cannot leave empty rows.
        const isTop = row === rows.length - 1;
        if (isTop && rows[row].cells.length === 0) rows.splice(row, 1);
        const target = row - 1;
        return clearSelectionState({
          ...state,
          rows,
          cursor: { row: target, index: rows[target].cells.length },
        });
      }

      return state;
    }

    case "SET_ROW_NOTE": {
      const rows = cloneRows(state.rows);
      if (!rows[action.row]) return state;
      rows[action.row].note = action.note;
      return { ...state, rows };
    }

    case "CLEAR_SELECTION":
      return clearSelectionState(state);

    case "EXTEND_SELECTION": {
      const anchor = state.selection.anchor ?? state.cursor;
      const { row, index } = state.cursor;
      let focus: Cursor = { row, index };

      if (action.dir === "left") focus = { row, index: index + 1 };
      if (action.dir === "right") focus = { row, index: index - 1 };
      if (action.dir === "up") focus = { row: row + 1, index };
      if (action.dir === "down") focus = { row: row - 1, index };

      focus = clampCursor(state, focus);

      return {
        ...state,
        cursor: focus,
        selection: {
          ...state.selection,
          active: true,
          anchor,
          focus,
          rect: buildRect(anchor, focus),
        },
      };
    }

    case "CAPTURE_MOTIF": {
      if (!state.selection.rect) return state;
      return {
        ...state,
        tileSource: {
          ...state.tileSource,
          rect: state.selection.rect,
          confirmed: true,
        },
      };
    }

    case "SET_DESTINATION_FROM_SELECTION": {
      if (!state.selection.rect) return state;
      return {
        ...state,
        tileApply: { mode: "dest", destRect: state.selection.rect },
      };
    }

    case "CLEAR_DESTINATION":
      return { ...state, tileApply: { ...state.tileApply, destRect: null } };

    case "TILE_DESTINATION":
      // Deliberately unimplemented until the cascade dialog exists: repeating a
      // motif that is not count-neutral changes every row above it, and which
      // of the three repairs to apply is the knitter's call, not a default.
      return state;

    default:
      return state;
  }
}

export { createProject, DEFAULT_STITCH };
