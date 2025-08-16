import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Store() {
  const navigate = useNavigate();
  const [games, setGames] = React.useState([]);
  const [gOffset, setGOffset] = React.useState(0);
  const [gHasMore, setGHasMore] = React.useState(true);
  const [gLoading, setGLoading] = React.useState(false);
  const [sort, setSort] = React.useState("rating");
  const PAGE_SIZE = 60;

  const gOffsetRef = React.useRef(0);
  const gLoadingRef = React.useRef(false);
  const sortRef = React.useRef(sort);
  const gHasMoreRef = React.useRef(true);
  const sentinelRef = React.useRef(null);
  const triggerLockRef = React.useRef(false);

  const [autoLoad] = React.useState(true);

  React.useEffect(() => { gOffsetRef.current = gOffset; }, [gOffset]);
  React.useEffect(() => { gLoadingRef.current = gLoading; }, [gLoading]);
  React.useEffect(() => { sortRef.current = sort; }, [sort]);
  React.useEffect(() => { gHasMoreRef.current = gHasMore; }, [gHasMore]);

  const fetchGames = React.useCallback((reset = false) => {
    if (gLoadingRef.current) return;
    gLoadingRef.current = true;
    setGLoading(true);

    const offset = reset ? 0 : gOffsetRef.current;
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    const username = user && user.username ? `&username=${encodeURIComponent(user.username)}` : "";
    const sortParam = encodeURIComponent(sortRef.current);

    fetch(`/api/store/games?sort=${sortParam}&limit=${PAGE_SIZE}&offset=${offset}${username}`)
      .then((r) => r.json())
      .then((list) => {
        if (Array.isArray(list)) {
          setGames((prev) => {
            const base = reset ? [] : prev;
            const seen = new Set(base.map((g) => String(g.id)));
            const append = list.filter((g) => !seen.has(String(g.id)));
            return [...base, ...append];
          });
          const got = list.length > 0;
          const more = got && list.length === PAGE_SIZE;
          setGHasMore(more);
          gHasMoreRef.current = more;

          const nextOffset = offset + (got ? list.length : 0);
          setGOffset(nextOffset);
          gOffsetRef.current = nextOffset;
        } else {
          if (reset) setGames([]);
          setGHasMore(false);
          gHasMoreRef.current = false;
        }
      })
      .catch(() => {
        if (reset) setGames([]);
        setGHasMore(false);
        gHasMoreRef.current = false;
      })
      .finally(() => {
        setGLoading(false);
        gLoadingRef.current = false;
      });
  }, []);

  React.useEffect(() => { fetchGames(true); }, [fetchGames]);

  React.useEffect(() => {
    setGHasMore(true);
    setGOffset(0);
    gOffsetRef.current = 0;
    gHasMoreRef.current = true;
    fetchGames(true);
  }, [sort, fetchGames]);

  React.useEffect(() => {
    if (!autoLoad) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          if (!triggerLockRef.current) {
            triggerLockRef.current = true;
            fetchGames(false);
          }
        } else {
          triggerLockRef.current = false;
        }
      },
      { root: null, threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchGames, autoLoad]);

  const addToLibrary = async (item) => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user) return alert("Sign in first");
    const res = await fetch(`/api/library/${user.username}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, name: item.name }),
    });
    if (res.ok) {
      try {
        const key = `installed_${user.username}`;
        const arr = JSON.parse(localStorage.getItem(key) || "[]");
        const next = Array.isArray(arr) ? arr.slice() : [];
        if (!next.some((v) => Number(v) === Number(item.id))) {
          next.push(Number(item.id));
          localStorage.setItem(key, JSON.stringify(next));
        }
      } catch {}
      navigate("/home/games");
    }
  };

  return (
    <div>
      <h1>Store</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <label>Sort games by:</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{
            borderRadius: 8,
            padding: "6px 10px",
            background: "#151515",
            color: "#fff",
            border: "1px solid #333",
          }}
        >
          <option value="rating">Player rating</option>
          <option value="price_asc">Price (low to high)</option>
          <option value="price_desc">Price (high to low)</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        {games.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No games found.</div>
        ) : (
          games.map((g) => (
            <div
              key={g.id}
              style={{
                background: "#1f1f1f",
                borderRadius: 10,
                overflow: "hidden",
                position: "relative",
                height: 320,
                paddingBottom: 48,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Link to={`/home/games/${g.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
                <img src={g.coverUrl} alt={g.name} style={{ width: "100%", height: 200, objectFit: "cover" }} />
                {g.installed ? (
                  <div style={{ position: "absolute", top: 8, left: 8, background: "#2e7d32", color: "#fff", padding: "2px 6px", borderRadius: 6, fontSize: 12 }}>
                    Owned
                  </div>
                ) : null}
                <div style={{ padding: 8 }}>
                  <div style={{ fontWeight: 600, lineHeight: 1.2, minHeight: 32, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{g.name}</div>
                  <div style={{ opacity: 0.8, fontSize: 12 }}>
                    Rating: {g.rating ? g.rating.toFixed(0) : "N/A"} • ${g.price.toFixed(2)}
                  </div>
                </div>
              </Link>
              <div style={{ position: "absolute", left: 8, bottom: 8 }}>
                <button
                  onClick={() => addToLibrary(g)}
                  disabled={Boolean(g.installed)}
                  style={{ borderRadius: 8, padding: "6px 10px", opacity: g.installed ? 0.6 : 1, cursor: g.installed ? "not-allowed" : "pointer" }}
                >
                  {g.installed ? "Owned" : "Buy"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {autoLoad ? (
        <div ref={sentinelRef} style={{ height: 24 }} />
      ) : (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          {gHasMore ? (
            <button disabled={gLoading} onClick={() => fetchGames(false)}>
              {gLoading ? "Loading..." : "Load more"}
            </button>
          ) : (
            <span style={{ opacity: 0.7 }}>No more games</span>
          )}
        </div>
      )}
    </div>
  );
}
