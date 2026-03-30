import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>KnitGrid v2</h1>
      <p>React rebuild in progress.</p>

      <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link to="/create">Create Pattern</Link>
        <Link to="/workspace">Workspace</Link>
        <Link to="/patterns">Pattern Zone</Link>
        <Link to="/settings">Settings</Link>
      </nav>
    </main>
  );
}