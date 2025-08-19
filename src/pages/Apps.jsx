import React from "react";

const apps = [
  { id: "netflix", name: "Netflix", icon: "https://cdn.simpleicons.org/netflix/E50914" },
  { id: "youtube", name: "YouTube", icon: "https://cdn.simpleicons.org/youtube/FF0000" },
  { id: "hbo", name: "HBO", icon: "https://cdn.simpleicons.org/hbo/FFFFFF" },
  { id: "spotify", name: "Spotify", icon: "https://cdn.simpleicons.org/spotify/1DB954" },
  { id: "twitch", name: "Twitch", icon: "https://cdn.simpleicons.org/twitch/9146FF" },
  { id: "crunchyroll", name: "Crunchyroll", icon: "https://cdn.simpleicons.org/crunchyroll/F47521" },
  { id: "paramountplus", name: "Paramount+", icon: "https://cdn.simpleicons.org/paramountplus/0064E1" },
  { id: "plex", name: "Plex", icon: "https://cdn.simpleicons.org/plex/E5A00D" },
  { id: "vimeo", name: "Vimeo", icon: "https://cdn.simpleicons.org/vimeo/1AB7EA" },
  { id: "appletv", name: "Apple TV", icon: "https://cdn.simpleicons.org/appletv/FFFFFF" },
  { id: "tubi", name: "Tubi", icon: "https://cdn.simpleicons.org/tubi/FF6B00" },
  { id: "max", name: "Max", icon: "https://cdn.simpleicons.org/max/0026FF" },
];

export default function Apps() {
  return (
    <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
      <h1>Apps</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 30,
          marginTop: 16,
        }}
      >
        {apps.map((a) => (
          <button
            key={a.id}
            style={{
              padding: 12,
              borderRadius: 10,
              border: "1px solid #333",
              background: "#1f1f1f",
              color: "#fff",
              minHeight: 140,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
            title={a.name}
          >
            <div style={{ width: 64, height: 64, display: "grid", placeItems: "center" }}>
              <img
                src={a.icon}
                alt={`${a.name} logo`}
                style={{ maxWidth: "70%", maxHeight: "70%", objectFit: "contain", display: "block" }}
              />
            </div>
            <div style={{ fontSize: 14, textAlign: "center" }}>{a.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
