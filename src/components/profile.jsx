import React from "react";

export default function ProfileCard({
  avatar,
  name,
  username,
  lastOnline,
  bgFrom,
  bgTo,
  isActive,
  onSignIn,
  onActivate
}) {
  const handleLogin = async () => {
    try {
      const res = await fetch("/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      console.log("Server response:", data);
      if (res.ok) {
        localStorage.setItem("currentUser", JSON.stringify({ username }));
        window.location.href = "/home";
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <div
      className="profile-card"
      onClick={onActivate}
      style={{
        background: `linear-gradient(to bottom right, ${bgFrom}, ${bgTo})`,
        padding: "20px",
        borderRadius: "12px",
        textAlign: "center",
        width: "200px",
        color: "white",
        fontFamily: "sans-serif",
        transition: "transform 0.2s, border 0.2s, box-shadow 0.2s",
        cursor: "pointer",
        border: isActive ? "3px solid white" : "3px solid transparent",
        boxShadow: isActive
          ? "0 0 15px rgba(255,255,255,0.7)"
          : "0 0 5px rgba(0,0,0,0.2)",
        transform: isActive ? "scale(1.05)" : "scale(1)",
      }}
    >
      <img
        src={avatar}
        alt={name}
        style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          objectFit: "cover",
          marginBottom: "10px",
        }}
      />
      <h2 style={{ margin: "5px 0" }}>{name}</h2>
      <p style={{ margin: "5px 0", fontSize: "0.9em", opacity: 0.8 }}>
        @{username}
      </p>
      <p style={{ margin: "5px 0", fontSize: "0.8em", opacity: 0.7 }}>
        {lastOnline}
      </p>
      {isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onSignIn) {
              onSignIn();
            } else {
              handleLogin();
            }
          }}
          style={{
            marginTop: "10px",
            padding: "8px 12px",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            border: "none",
            borderRadius: "6px",
            color: "white",
            cursor: "pointer",
          }}
        >
          Sign in
        </button>
      )}
    </div>
  );
}
