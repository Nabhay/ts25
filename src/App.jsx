import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import ProfileCard from "./components/profile.jsx";

export default function App() {
  const [profiles, setProfiles] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [plusHeight, setPlusHeight] = useState(null);

  useEffect(() => {
    fetch("/api/profiles")
      .then((res) => res.json())
      .then((data) => {
        setProfiles(data);
        setActiveIndex(0);
      });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === "a") {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : profiles.length - 1));
      }
      if (e.key.toLowerCase() === "d") {
        setActiveIndex((prev) => (prev < profiles.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [profiles]);

  const handleSignIn = async (username) => {
    try {
      const res = await fetch("/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (res.ok) {
        localStorage.setItem("currentUser", JSON.stringify({ username }));
        window.location.href = "/home";
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddProfile = () => {
    window.location.href = "/auth";
  };

  useEffect(() => {
    const updateHeight = () => {
      const nodes = document.querySelectorAll('.profile-card');
      let maxH = 0;
      nodes.forEach((n) => {
        const h = n.getBoundingClientRect().height;
        if (h > maxH) maxH = h;
      });
      if (maxH > 0) setPlusHeight(Math.ceil(maxH));
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [profiles]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        paddingTop: 72,
      }}
    >
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          zIndex: 9,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: "0 24px",
          background: "#0f0f0f",
          borderBottom: "1px solid #333",
        }}
      >
        <img src="/logo.svg" alt="Hexion logo" style={{ width: 28, height: 28 }} />
        <div style={{ fontSize: 18, fontWeight: 600, color: "#fff", letterSpacing: 0.5 }}>Hexion</div>
      </header>
      <div style={{ display: "flex", gap: "20px" }}>
        {profiles.map((p, index) => (
          <ProfileCard
            key={p.username}
            {...p}
            isActive={index === activeIndex}
            onSignIn={() => handleSignIn(p.username)}
            onActivate={() => setActiveIndex(index)}
          />
        ))}
    <button
          onClick={handleAddProfile}
          style={{
      height: plusHeight ? `${plusHeight}px` : "auto",
      alignSelf: plusHeight ? "auto" : "stretch",
            width: "200px",
            minHeight: "300px",
            border: "3px dashed gray",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            background: "#f0f0f0",
            padding: "20px",
          }}
        >
          <Plus size={96} />
        </button>
      </div>
    </div>
  );
}
