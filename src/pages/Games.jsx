import React from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

export default function Games() {
  const [games, setGames] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [installed, setInstalled] = React.useState(new Set());
  const userRef = React.useRef(null);
  const [filter, setFilter] = React.useState("all"); // all | installed | not
  const [sortBy, setSortBy] = React.useState("popularity"); // popularity | alpha

  const fetchAll = React.useCallback(() => {
    // Run once on mount; avoid coupling to `loading` to prevent effect loops.
    setLoading(true);
    const LIMIT = 60;
    fetch(`/api/games?limit=${LIMIT}&offset=0`)
      .then((r) => r.json())
      .then((list) => {
        if (Array.isArray(list)) setGames(list);
        else setGames([]);
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);
  React.useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    userRef.current = user;
    if (!user) return;
    const arr = JSON.parse(localStorage.getItem(`installed_${user.username}`) || "[]");
    const localIds = (Array.isArray(arr) ? arr : []).map((id) => Number(id));
  // Only consider locally installed ids as "installed"; buying/owning does not mark installed.
  setInstalled(new Set(localIds));
  }, []);

  React.useEffect(() => {
    const user = userRef.current;
    if (!user) return;
    const seededKey = `installed_seeded_${user.username}`;
    if (installed.size === 0 && games.length > 0 && !localStorage.getItem(seededKey)) {
      const pick = games.slice(0, Math.min(10, games.length));
      const ids = pick.map((g) => Number(g.id));
      setInstalled(new Set(ids));
      localStorage.setItem(`installed_${user.username}`, JSON.stringify(ids));
      localStorage.setItem(seededKey, "1");
    }
  }, [games, installed]);
  const sortedGames = React.useMemo(() => {
    // Attach installed meta and basic index
    let list = games.map((g, idx) => ({ ...g, __i: idx, __installed: installed.has(Number(g.id)) }));

    // Filter by installed state
    if (filter === "installed") list = list.filter((g) => g.__installed);
    else if (filter === "not") list = list.filter((g) => !g.__installed);

    // Sort by installed first, then selected criteria
    const alphaCmp = (a, b) => String(a.name || "").localeCompare(String(b.name || ""));
    const popCmp = (a, b) => (Number(b.popularity || 0) - Number(a.popularity || 0)) || (a.__i - b.__i);
    const innerCmp = sortBy === "alpha" ? alphaCmp : popCmp;
    list.sort((a, b) => {
      if (a.__installed !== b.__installed) return a.__installed ? -1 : 1;
      const r = innerCmp(a, b);
      if (r !== 0) return r;
      return a.__i - b.__i; // stable fallback
    });

    return list.map(({ __i, __installed, ...rest }) => rest);
  }, [games, installed, filter, sortBy]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
      <h1>Games</h1>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <label>Filter:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ borderRadius: 8, padding: "6px 10px", background: "#151515", color: "#fff", border: "1px solid #333" }}>
          <option value="all">All</option>
          <option value="installed">Installed</option>
          <option value="not">Not installed</option>
        </select>
        <label style={{ marginLeft: 16 }}>Sort by:</label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ borderRadius: 8, padding: "6px 10px", background: "#151515", color: "#fff", border: "1px solid #333" }}>
          <option value="popularity">Popularity</option>
          <option value="alpha">Alphabetical</option>
        </select>
      </div>
      {games.length === 0 && !loading ? (
        <div style={{ opacity: 0.8, padding: 8 }}>No games to show. Check your IGDB credentials or try again.</div>
      ) : null}
    <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 260px))",
          justifyContent: "center",
          gap: 30,
          marginTop: 16,
        }}
      >
  {sortedGames.map((g) => {
          const isInstalled = installed.has(Number(g.id));
          return (
            <Link key={g.id} to={`/home/games/${g.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ position: "relative", background: "#1f1f1f", borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ background: "#0f0f0f" }}>
                  <img
                    src={g.coverUrl}
                    alt={g.name}
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                      filter: isInstalled ? "none" : "grayscale(1)",
                    }}
                  />
                </div>
                <div style={{ position: "absolute", top: 8, left: 8, background: isInstalled ? "#2e7d32" : "#555", color: "#fff", padding: "2px 6px", borderRadius: 6, fontSize: 12 }}>
                  {isInstalled ? "Installed" : "Not installed"}
                </div>
                {/* Title footer with consistent height, vertically centered */}
                <div style={{ padding: 8 }}>
                  <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div
                      style={{
                        fontSize: 14,
                        lineHeight: 1.2,
                        textAlign: "center",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {g.name}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        <Link to="/home/store" style={{ textDecoration: "none" }}>
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              border: "2px dashed #555",
              background: "#151515",
              color: "#fff",
              minHeight: 240,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              cursor: "pointer",
            }}
            title="Open Store"
          >
            <Plus size={40} />
            <div style={{ fontSize: 14, textAlign: "center" }}>Open Store</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
