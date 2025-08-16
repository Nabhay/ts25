import React from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function GameDetails() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = React.useState(null);
  const [installing, setInstalling] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [launching, setLaunching] = React.useState(false);
  const userRef = React.useRef(null);

  // Load current user and installed state for this game
  React.useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    userRef.current = user;
    const gid = Number(gameId);
    if (!user || !Number.isFinite(gid)) {
      setIsInstalled(false);
      return;
    }
    try {
      const arr = JSON.parse(localStorage.getItem(`installed_${user.username}`) || "[]");
      const localInstalled = (Array.isArray(arr) ? arr : []).some((v) => Number(v) === gid);
      setIsInstalled(localInstalled);
    } catch {
      setIsInstalled(false);
    }
  }, [gameId]);
  React.useEffect(() => {
    fetch(`/api/games/${gameId}`)
      .then((r) => r.json())
      .then((data) =>
        setGame({
          ...data,
          stats: { hoursPlayed: 123, achievements: 45, progress: 78 },
        })
      )
      .catch(() => {
        setGame({
          id: gameId,
          name: "Sample Game",
          summary: "This is a placeholder game description. Hook up IGDB later.",
          screenshots: [
            "https://placehold.co/600x338/111/FFF?text=Gameplay+1",
            "https://placehold.co/600x338/222/FFF?text=Gameplay+2",
          ],
          stats: { hoursPlayed: 123, achievements: 45, progress: 78 },
          videoUrl: null,
        });
      });
  }, [gameId]);

  if (!game) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <h1 style={{ margin: 0, flex: 1 }}>{game.name}</h1>
        {isInstalled ? (
          <button
            onClick={() => {
              if (launching) return;
              setLaunching(true);
              setTimeout(() => setLaunching(false), 5000);
            }}
            disabled={launching}
            style={{
              borderRadius: 10,
              padding: "8px 14px",
              background: "#2e7d32",
              color: "#fff",
              border: "none",
              opacity: launching ? 0.7 : 1,
              cursor: launching ? "not-allowed" : "pointer",
            }}
            title={`Play ${game.name}`}
          >
            {launching ? "Launching…" : "Play"}
          </button>
        ) : null}
        <button
          onClick={async () => {
            if (installing) return;
            const user = userRef.current;
            if (!user) {
              alert("Please sign in to install");
              return;
            }
            const gid = Number(gameId);
            if (!Number.isFinite(gid)) return;
            setInstalling(true);
            try {
              // Try to persist on backend
              const res = await fetch(`/api/library/${encodeURIComponent(user.username)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: gid, name: game.name }),
              });
              // Always update local cache so Games page can reflect immediately
              try {
                const key = `installed_${user.username}`;
                const arr = JSON.parse(localStorage.getItem(key) || "[]");
                const next = Array.isArray(arr) ? arr.slice() : [];
                if (!next.some((v) => Number(v) === gid)) next.push(gid);
                localStorage.setItem(key, JSON.stringify(next));
              } catch {}
              if (res.ok) {
                setIsInstalled(true);
                // Navigate to Games so the list reflects Installed grouping
                navigate("/home/games");
              } else {
                // Even if backend fails, we updated local cache; stay on page but mark installed
                setIsInstalled(true);
              }
            } catch {
              // Network error: still try to mark as installed locally
              try {
                const user = userRef.current;
                if (user) {
                  const key = `installed_${user.username}`;
                  const arr = JSON.parse(localStorage.getItem(key) || "[]");
                  const next = Array.isArray(arr) ? arr.slice() : [];
                  const gid = Number(gameId);
                  if (Number.isFinite(gid) && !next.some((v) => Number(v) === gid)) next.push(gid);
                  localStorage.setItem(key, JSON.stringify(next));
                }
              } catch {}
              setIsInstalled(true);
            } finally {
              setInstalling(false);
            }
          }}
          disabled={installing || isInstalled}
          style={{
            borderRadius: 10,
            padding: "8px 14px",
            opacity: installing || isInstalled ? 0.7 : 1,
            cursor: installing || isInstalled ? "not-allowed" : "pointer",
            background: isInstalled ? "#2e7d32" : "#2196f3",
            color: "#fff",
            border: "none",
          }}
          title={isInstalled ? "Already installed" : "Install game"}
        >
          {isInstalled ? "Installed" : installing ? "Installing…" : "Install"}
        </button>
      </div>
  <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          alignItems: "stretch",
        }}
      >
        <div style={{ gridColumn: "span 2", background: "#111", borderRadius: 12, overflow: "hidden" }}>
          {game.videoUrl ? (
            <iframe
              src={game.videoUrl}
              title={`${game.name} trailer`}
              style={{ width: "100%", aspectRatio: "16 / 9", border: 0, display: "block" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : game.screenshots?.[0] ? (
            <img src={game.screenshots[0]} alt="hero" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ padding: 16 }}>No trailer available</div>
          )}
        </div>

        <div style={{ background: "#1f1f1f", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Summary</h3>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{game.summary || "No description."}</p>
        </div>

        <div style={{ background: "#1f1f1f", borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Your Stats</h3>
          <ul style={{ marginTop: 8 }}>
            <li>Hours Played: {game.stats.hoursPlayed}</li>
            <li>Achievements: {game.stats.achievements}</li>
            <li>Progress: {game.stats.progress}%</li>
          </ul>
          <div style={{ marginTop: 8 }}>
            <div style={{ height: 8, background: "#333", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${game.stats.progress}%`, height: "100%", background: "#4caf50" }} />
            </div>
          </div>
        </div>

        <div style={{ gridColumn: "span 2", background: "#1f1f1f", borderRadius: 12, padding: 12 }}>
          <h3 style={{ margin: "4px 8px 12px" }}>Gallery</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {(game.screenshots || []).slice(0, 2).map((s, i) => (
              <img key={i} src={s} alt={`s${i}`} style={{ width: "100%", borderRadius: 8, display: "block" }} />
            ))}
          </div>
        </div>
      </div>
      {launching ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "grayscale(0.8)",
          }}
          aria-busy
          aria-label="Launching"
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <svg width="64" height="64" viewBox="0 0 50 50" aria-hidden="true">
              <circle
                cx="25"
                cy="25"
                r="20"
                stroke="#90caf9"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                style={{ opacity: 0.3 }}
              />
              <circle
                cx="25"
                cy="25"
                r="20"
                stroke="#2196f3"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="31.4 125.6"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 25 25"
                  to="360 25 25"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
            <div style={{ color: "#fff", fontSize: 16 }}>Launching {game.name}…</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
