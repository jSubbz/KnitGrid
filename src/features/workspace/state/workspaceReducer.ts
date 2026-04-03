import type {
  KnitProject,
  KnitMode,
  PatternCell,
  PatternSymbol,
  WorkspaceMode,
} from "../../project/types";

export type YarnField =
  | "stitchesPerInch"
  | "rowsPerInch"
  | "yarnName"
  | "yarnDescriptors"
  | "patternTags";

export type WorkspaceAction =
  | { type: "SET_YARN_FIELD"; field: YarnField; value: string }
  | { type: "SET_KNIT_MODE"; mode: KnitMode }
  | { type: "SET_WORKSPACE_MODE"; mode: WorkspaceMode }
  | { type: "SET_DIMENSIONS"; rows: number; cols: number }
  | { type: "ADD_ROW" }
  | { type: "REMOVE_ROW" }
  | { type: "ADD_COL" }
  | { type: "REMOVE_COL" }
  | { type: "TOGGLE_MIRROR_X" }
  | { type: "TOGGLE_MIRROR_Y" }
  | { type: "CLEAR_MIRRORS" }
  | { type: "SET_SHAPE_CELL"; r: number; c: number; value: boolean }
  | { type: "MOVE_CURSOR"; dir: "left" | "right" | "up" | "down" }
  | { type: "NEXT_ROW_START" }
  | { type: "PAINT_AND_ADVANCE"; symbol: PatternSymbol }
  | { type: "ERASE_AND_BACKSPACE" }
  | { type: "CLEAR_SELECTION" }
  | { type: "EXTEND_SELECTION"; dir: "left" | "right" | "up" | "down" }
  | { type: "CAPTURE_MOTIF" }
  | { type: "SET_DESTINATION_FROM_SELECTION" }
  | { type: "CLEAR_DESTINATION" }
  | { type: "TILE_ACROSS"; strategy: "partial" | "truncate" }
  | { type: "TILE_UP"; strategy: "partial" | "truncate" }
  | { type: "TILE_DESTINATION"; strategy: "partial" | "truncate" };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function createShapeMask(rows: number, cols: number, fill = true): boolean[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => fill)
  );
}

function createPattern(rows: number, cols: number): PatternCell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ symbol: "empty" as const }))
  );
}

function cloneShapeMask(mask: boolean[][]): boolean[][] {
  return mask.map((row) => [...row]);
}

function clonePattern(pattern: PatternCell[][]): PatternCell[][] {
  return pattern.map((row) => row.map((cell) => ({ ...cell })));
}

function getMirroredPoints(
  rows: number,
  cols: number,
  r: number,
  c: number,
  mirrorX: boolean,
  mirrorY: boolean
) {
  const points = new Set<string>();
  points.add(`${r},${c}`);

  if (mirrorX) {
    points.add(`${r},${cols - 1 - c}`);
  }

  if (mirrorY) {
    points.add(`${rows - 1 - r},${c}`);
  }

  if (mirrorX && mirrorY) {
    points.add(`${rows - 1 - r},${cols - 1 - c}`);
  }

  return [...points].map((key) => {
    const [rr, cc] = key.split(",").map(Number);
    return { r: rr, c: cc };
  });
}

function resizeProject(state: KnitProject, nextRows: number, nextCols: number): KnitProject {
  const rows = clamp(nextRows, 1, 300);
  const cols = clamp(nextCols, 1, 300);

  const nextMask = createShapeMask(rows, cols, false);
  const nextPattern = createPattern(rows, cols);

  const rowOffset = rows - state.rows;
  const colOffset = cols - state.cols;

  for (let r = 0; r < state.rows; r += 1) {
    for (let c = 0; c < state.cols; c += 1) {
      const rr = r + Math.max(0, rowOffset);
      const cc = c + Math.max(0, colOffset);

      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
        nextMask[rr][cc] = state.shapeMask[r][c];
        nextPattern[rr][cc] = { ...state.pattern[r][c] };
      }
    }
  }

  return {
    ...state,
    rows,
    cols,
    shapeMask: nextMask,
    pattern: nextPattern,
    cursor: {
      r: rows - 1,
      c: cols - 1,
    },
    selectedRow: rows - 1,
    selection: {
      ...state.selection,
      active: false,
      anchor: null,
      focus: null,
      rect: null,
    },
    tileApply: {
      ...state.tileApply,
      destRect: null,
    },
  };
}

function getPreviousCursor(state: KnitProject) {
  const { r, c } = state.cursor;

  if (c < state.cols - 1) {
    return { r, c: c + 1 };
  }

  if (r < state.rows - 1) {
    return { r: r + 1, c: 0 };
  }

  return { r, c };
}

function getAdvancedCursor(state: KnitProject) {
  const { r, c } = state.cursor;

  if (c > 0) {
    return { r, c: c - 1 };
  }

  if (r > 0) {
    return { r: r - 1, c: state.cols - 1 };
  }

  return { r, c };
}

function moveCursorByDirection(
  state: KnitProject,
  dir: "left" | "right" | "up" | "down"
) {
  const { r, c } = state.cursor;

  let nextR = r;
  let nextC = c;

  if (dir === "left") nextC -= 1;
  if (dir === "right") nextC += 1;
  if (dir === "up") nextR -= 1;
  if (dir === "down") nextR += 1;

  nextR = clamp(nextR, 0, state.rows - 1);
  nextC = clamp(nextC, 0, state.cols - 1);

  return { r: nextR, c: nextC };
}

function buildRect(
  a: { r: number; c: number },
  b: { r: number; c: number }
) {
  return {
    minR: Math.min(a.r, b.r),
    minC: Math.min(a.c, b.c),
    maxR: Math.max(a.r, b.r),
    maxC: Math.max(a.c, b.c),
  };
}

export function workspaceReducer(
  state: KnitProject,
  action: WorkspaceAction
): KnitProject {
  switch (action.type) {
    case "SET_YARN_FIELD":
      return {
        ...state,
        yarn: {
          ...state.yarn,
          [action.field]: action.value,
        },
      };

    case "SET_KNIT_MODE":
      return {
        ...state,
        knitMode: action.mode,
      };

    case "SET_WORKSPACE_MODE":
      return {
        ...state,
        workspaceMode: action.mode,
      };

    case "SET_DIMENSIONS":
      return resizeProject(state, action.rows, action.cols);

    case "ADD_ROW":
      return resizeProject(state, state.rows + 1, state.cols);

    case "REMOVE_ROW":
      return resizeProject(state, state.rows - 1, state.cols);

    case "ADD_COL":
      return resizeProject(state, state.rows, state.cols + 1);

    case "REMOVE_COL":
      return resizeProject(state, state.rows, state.cols - 1);

    case "TOGGLE_MIRROR_X":
      return {
        ...state,
        mirrorX: !state.mirrorX,
      };

    case "TOGGLE_MIRROR_Y":
      return {
        ...state,
        mirrorY: !state.mirrorY,
      };

    case "CLEAR_MIRRORS":
      return {
        ...state,
        mirrorX: false,
        mirrorY: false,
      };

    case "SET_SHAPE_CELL": {
      if (
        action.r < 0 ||
        action.r >= state.rows ||
        action.c < 0 ||
        action.c >= state.cols
      ) {
        return state;
      }

      const nextMask = cloneShapeMask(state.shapeMask);
      const points = getMirroredPoints(
        state.rows,
        state.cols,
        action.r,
        action.c,
        state.mirrorX,
        state.mirrorY
      );

      for (const point of points) {
        if (
          point.r >= 0 &&
          point.r < state.rows &&
          point.c >= 0 &&
          point.c < state.cols
        ) {
          nextMask[point.r][point.c] = action.value;
        }
      }

      return {
        ...state,
        shapeMask: nextMask,
      };
    }

    case "MOVE_CURSOR": {
      const nextCursor = moveCursorByDirection(state, action.dir);

      return {
        ...state,
        cursor: nextCursor,
        selectedRow: nextCursor.r,
      };
    }

    case "NEXT_ROW_START": {
      const { r } = state.cursor;

      if (r > 0) {
        return {
          ...state,
          cursor: { r: r - 1, c: state.cols - 1 },
          selectedRow: r - 1,
        };
      }

      return state;
    }

    case "PAINT_AND_ADVANCE": {
      const { r, c } = state.cursor;
      const nextPattern = clonePattern(state.pattern);

      nextPattern[r][c] = { symbol: action.symbol };

      const nextCursor = getAdvancedCursor(state);

      return {
        ...state,
        pattern: nextPattern,
        cursor: nextCursor,
        selectedRow: nextCursor.r,
      };
    }

    case "ERASE_AND_BACKSPACE": {
      const prevCursor = getPreviousCursor(state);
      const nextPattern = clonePattern(state.pattern);

      nextPattern[prevCursor.r][prevCursor.c] = { symbol: "empty" };

      return {
        ...state,
        pattern: nextPattern,
        cursor: prevCursor,
        selectedRow: prevCursor.r,
      };
    }

    case "CLEAR_SELECTION":
      return {
        ...state,
        selection: {
          ...state.selection,
          active: false,
          anchor: null,
          focus: null,
          rect: null,
        },
      };

    case "EXTEND_SELECTION": {
      const anchor = state.selection.active && state.selection.anchor
        ? state.selection.anchor
        : state.cursor;

      const baseCursor = state.selection.active && state.selection.focus
        ? state.selection.focus
        : state.cursor;

      const tempState = {
        ...state,
        cursor: baseCursor,
      };

      const nextCursor = moveCursorByDirection(tempState, action.dir);

      return {
        ...state,
        cursor: nextCursor,
        selectedRow: nextCursor.r,
        selection: {
          ...state.selection,
          active: true,
          anchor,
          focus: nextCursor,
          rect: buildRect(anchor, nextCursor),
        },
      };
    }

    case "CAPTURE_MOTIF": {
      if (!state.selection.rect) {
        return state;
      }

      const rect = state.selection.rect;

      return {
        ...state,
        tileSource: {
          ...state.tileSource,
          originR: rect.minR,
          originC: rect.minC,
          tileRows: rect.maxR - rect.minR + 1,
          tileCols: rect.maxC - rect.minC + 1,
          confirmed: true,
        },
        selection: {
          ...state.selection,
          active: false,
          anchor: null,
          focus: null,
          rect: null,
        },
      };
    }

    case "SET_DESTINATION_FROM_SELECTION": {
      if (!state.selection.rect) {
        return state;
      }

      return {
        ...state,
        tileApply: {
          ...state.tileApply,
          destRect: { ...state.selection.rect },
        },
        selection: {
          ...state.selection,
          active: false,
          anchor: null,
          focus: null,
          rect: null,
        },
      };
    }

    case "CLEAR_DESTINATION":
      return {
        ...state,
        tileApply: {
          ...state.tileApply,
          destRect: null,
        },
      };

    case "TILE_ACROSS": {
      if (!state.tileSource.confirmed) {
        return state;
      }

      const { originR, originC, tileRows, tileCols } = state.tileSource;
      const nextPattern = clonePattern(state.pattern);

      const source: PatternCell[][] = [];

      for (let rr = 0; rr < tileRows; rr += 1) {
        const row: PatternCell[] = [];
        for (let cc = 0; cc < tileCols; cc += 1) {
          const srcR = originR + rr;
          const srcC = originC + cc;
          row.push({ ...state.pattern[srcR][srcC] });
        }
        source.push(row);
      }

      for (let baseC = originC; baseC > -tileCols; baseC -= tileCols) {
        const wouldOverflowLeft = baseC < 0;

        if (action.strategy === "truncate" && wouldOverflowLeft) {
          continue;
        }

        for (let rr = 0; rr < tileRows; rr += 1) {
          for (let cc = 0; cc < tileCols; cc += 1) {
            const destR = originR + rr;
            const destC = baseC + cc;

            if (destR < 0 || destR >= state.rows || destC < 0 || destC >= state.cols) {
              continue;
            }

            if (!state.shapeMask[destR][destC]) {
              continue;
            }

            nextPattern[destR][destC] = { ...source[rr][cc] };
          }
        }
      }

      return {
        ...state,
        pattern: nextPattern,
      };
    }

    case "TILE_UP": {
      if (!state.tileSource.confirmed) {
        return state;
      }

      const { originR, originC, tileRows, tileCols } = state.tileSource;
      const nextPattern = clonePattern(state.pattern);

      const source: PatternCell[][] = [];

      for (let rr = 0; rr < tileRows; rr += 1) {
        const row: PatternCell[] = [];
        for (let cc = 0; cc < tileCols; cc += 1) {
          const srcR = originR + rr;
          const srcC = originC + cc;
          row.push({ ...state.pattern[srcR][srcC] });
        }
        source.push(row);
      }

      for (let baseR = originR; baseR > -tileRows; baseR -= tileRows) {
        const wouldOverflowTop = baseR < 0;

        if (action.strategy === "truncate" && wouldOverflowTop) {
          continue;
        }

        for (let rr = 0; rr < tileRows; rr += 1) {
          for (let cc = 0; cc < tileCols; cc += 1) {
            const destR = baseR + rr;
            const destC = originC + cc;

            if (destR < 0 || destR >= state.rows || destC < 0 || destC >= state.cols) {
              continue;
            }

            if (!state.shapeMask[destR][destC]) {
              continue;
            }

            nextPattern[destR][destC] = { ...source[rr][cc] };
          }
        }
      }

      return {
        ...state,
        pattern: nextPattern,
      };
    }

    case "TILE_DESTINATION": {
      if (!state.tileSource.confirmed || !state.tileApply.destRect) {
        return state;
      }

      const { originR, originC, tileRows, tileCols } = state.tileSource;
      const dest = state.tileApply.destRect;
      const nextPattern = clonePattern(state.pattern);

      const source: PatternCell[][] = [];

      for (let rr = 0; rr < tileRows; rr += 1) {
        const row: PatternCell[] = [];
        for (let cc = 0; cc < tileCols; cc += 1) {
          const srcR = originR + rr;
          const srcC = originC + cc;
          row.push({ ...state.pattern[srcR][srcC] });
        }
        source.push(row);
      }

      for (let baseR = dest.minR; baseR <= dest.maxR; baseR += tileRows) {
        for (let baseC = dest.minC; baseC <= dest.maxC; baseC += tileCols) {
          const wouldOverflowBottom = baseR + tileRows - 1 > dest.maxR;
          const wouldOverflowRight = baseC + tileCols - 1 > dest.maxC;

          if (
            action.strategy === "truncate" &&
            (wouldOverflowBottom || wouldOverflowRight)
          ) {
            continue;
          }

          for (let rr = 0; rr < tileRows; rr += 1) {
            for (let cc = 0; cc < tileCols; cc += 1) {
              const destR = baseR + rr;
              const destC = baseC + cc;

              if (destR < dest.minR || destR > dest.maxR) {
                continue;
              }

              if (destC < dest.minC || destC > dest.maxC) {
                continue;
              }

              if (destR < 0 || destR >= state.rows || destC < 0 || destC >= state.cols) {
                continue;
              }

              if (!state.shapeMask[destR][destC]) {
                continue;
              }

              nextPattern[destR][destC] = { ...source[rr][cc] };
            }
          }
        }
      }

      return {
        ...state,
        pattern: nextPattern,
      };
    }

    default:
      return state;
  }
}