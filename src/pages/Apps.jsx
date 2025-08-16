import React from "react";
import { Link } from "react-router-dom";

const apps = [
  { id: "netflix", name: "Netflix", icon: "https://cdn.simpleicons.org/netflix/ffffff" },
  { id: "youtube", name: "YouTube", icon: "https://cdn.simpleicons.org/youtube/ffffff" },
  { id: "hbo", name: "HBO", icon: "https://cdn.simpleicons.org/hbo/ffffff" },
  { id: "spotify", name: "Spotify", icon: "https://cdn.simpleicons.org/spotify/ffffff" },
  { id: "twitch", name: "Twitch", icon: "https://cdn.simpleicons.org/twitch/ffffff" },
  { id: "crunchyroll", name: "Crunchyroll", icon: "https://cdn.simpleicons.org/crunchyroll/ffffff" },
  { id: "paramountplus", name: "Paramount+", icon: "https://cdn.simpleicons.org/paramountplus/ffffff" },
  { id: "plex", name: "Plex", icon: "https://cdn.simpleicons.org/plex/ffffff" },
  { id: "vimeo", name: "Vimeo", icon: "https://cdn.simpleicons.org/vimeo/ffffff" },
  { id: "appletv", name: "Apple TV", icon: "https://cdn.simpleicons.org/appletv/ffffff" },
  { id: "tubi", name: "Tubi", icon: "https://cdn.simpleicons.org/tubi/ffffff" },
  { id: "max", name: "Max", icon: "https://cdn.simpleicons.org/max/ffffff" },
];

export default function Apps() {
  return (
    <div>
      <h1>Apps</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 12,
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
            <img
              src={a.icon}
              alt={`${a.name} logo`}
              style={{ width: 48, height: 48, objectFit: "contain" }}
            />
            <div style={{ fontSize: 14, textAlign: "center" }}>{a.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
