import React from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

export default function Games() {
  const [games, setGames] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [installed, setInstalled] = React.useState(new Set());
  const userRef = React.useRef(null);

  const fetchAll = React.useCallback(() => {
    if (loading) return;
    setLoading(true);
    const LIMIT = 60;
    fetch(`/api/games?limit=${LIMIT}&offset=0`)
      .then((r) => r.json())
      .then((list) => {
        if (Array.isArray(list)) setGames(list);
        else setGames([]);
      })
      .finally(() => setLoading(false));
  }, [loading]);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);
  React.useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    userRef.current = user;
    if (!user) return;
    const arr = JSON.parse(localStorage.getItem(`installed_${user.username}`) || "[]");
    const localIds = (Array.isArray(arr) ? arr : []).map((id) => Number(id));
    setInstalled(new Set(localIds));
    fetch(`/api/library/${encodeURIComponent(user.username)}`)
      .then((r) => r.json())
      .then((items) => {
        if (Array.isArray(items)) {
          const libIds = items
            .map((it) => Number(it.id))
            .filter((n) => Number.isFinite(n));
          const merged = new Set([...localIds, ...libIds]);
          setInstalled(merged);
          localStorage.setItem(`installed_${user.username}`, JSON.stringify(Array.from(merged)));
        }
      })
      .catch(() => {
      });
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
    const withMeta = games.map((g, idx) => ({ ...g, __i: idx, __installed: installed.has(Number(g.id)) }));
    withMeta.sort((a, b) => {
      if (a.__installed !== b.__installed) return a.__installed ? -1 : 1;
      return a.__i - b.__i;
    });
    return withMeta.map(({ __i, __installed, ...rest }) => rest);
  }, [games, installed]);

  return (
    <div>
      <h1>Games</h1>
      {games.length === 0 && !loading ? (
        <div style={{ opacity: 0.8, padding: 8 }}>No games to show. Check your IGDB credentials or try again.</div>
      ) : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
  {sortedGames.map((g) => {
          const isInstalled = installed.has(Number(g.id));
          return (
            <Link key={g.id} to={`/home/games/${g.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ position: "relative", background: "#1f1f1f", borderRadius: 10, overflow: "hidden", height: 240, display: "flex", flexDirection: "column" }}>
                <img
                  src={g.coverUrl}
                  alt={g.name}
                  style={{
                    width: "100%",
                    height: 180,
                    objectFit: "cover",
                    display: "block",
                    filter: isInstalled ? "none" : "grayscale(1)",
                  }}
                />
                <div style={{ position: "absolute", top: 8, left: 8, background: isInstalled ? "#2e7d32" : "#555", color: "#fff", padding: "2px 6px", borderRadius: 6, fontSize: 12 }}>
                  {isInstalled ? "Installed" : "Not installed"}
                </div>
                {/* Play is available only on Game Details page */}
                <div
                  style={{
                    padding: 8,
                    fontSize: 14,
                    lineHeight: 1.2,
                    height: 48,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  {g.name}
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
