import { Link } from "react-router-dom";
import { useWorkspace } from "../features/workspace/state/WorkspaceContext";

export default function CreatePatternPage() {
  const { state, dispatch } = useWorkspace();

  return (
    <main style={{ padding: 24, display: "grid", gap: 16, maxWidth: 720 }}>
      <h1>Create Pattern</h1>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Stitches per inch</span>
        <input
          value={state.yarn.stitchesPerInch}
          onChange={(e) =>
            dispatch({
              type: "SET_YARN_FIELD",
              field: "stitchesPerInch",
              value: e.target.value,
            })
          }
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Rows per inch</span>
        <input
          value={state.yarn.rowsPerInch}
          onChange={(e) =>
            dispatch({
              type: "SET_YARN_FIELD",
              field: "rowsPerInch",
              value: e.target.value,
            })
          }
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Yarn name</span>
        <input
          value={state.yarn.yarnName}
          onChange={(e) =>
            dispatch({
              type: "SET_YARN_FIELD",
              field: "yarnName",
              value: e.target.value,
            })
          }
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Yarn descriptors</span>
        <textarea
          value={state.yarn.yarnDescriptors}
          onChange={(e) =>
            dispatch({
              type: "SET_YARN_FIELD",
              field: "yarnDescriptors",
              value: e.target.value,
            })
          }
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Pattern tags</span>
        <input
          value={state.yarn.patternTags}
          placeholder="colorwork, socks, winter"
          onChange={(e) =>
            dispatch({
              type: "SET_YARN_FIELD",
              field: "patternTags",
              value: e.target.value,
            })
          }
        />
      </label>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          type="button"
          onClick={() => dispatch({ type: "SET_KNIT_MODE", mode: "flat" })}
        >
          Flat
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "SET_KNIT_MODE", mode: "round" })}
        >
          Round
        </button>
      </div>

      <p>Current mode: {state.knitMode}</p>
      <p>Tags: {state.yarn.patternTags || "none"}</p>

      <div style={{ display: "flex", gap: 12 }}>
        <Link to="/">Back</Link>
        <Link to="/workspace">Continue to workspace</Link>
      </div>
    </main>
  );
}