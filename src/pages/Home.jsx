import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Gamepad2, AppWindow, ShoppingBag, Users } from "lucide-react";

const linkStyle = ({ isActive }) => ({
  width: 48,
  height: 48,
  borderRadius: 10,
  textDecoration: "none",
  color: isActive ? "#000" : "#fff",
  background: isActive ? "#fff" : "transparent",
  border: "1px solid #333",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export default function HomeLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("currentUser") || "null");

  React.useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 84,
          boxSizing: "border-box",
          padding: 12,
          borderRight: "1px solid #333",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          zIndex: 10,
        }}
      >
        <button
          onClick={() => navigate("/")}
          title="Home"
          aria-label="Home"
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            border: "1px solid #333",
            background: "#151515",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
            cursor: "pointer",
          }}
        >
          <img src="/logo.svg" alt="Home" style={{ width: 24, height: 24 }} />
        </button>
        <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <NavLink to="games" style={linkStyle} title="Games" aria-label="Games">
            <Gamepad2 />
          </NavLink>
          <NavLink to="apps" style={linkStyle} title="Apps" aria-label="Apps">
            <AppWindow />
          </NavLink>
          <NavLink to="store" style={linkStyle} title="Store" aria-label="Store">
            <ShoppingBag />
          </NavLink>
          <NavLink to="friends" style={linkStyle} title="Friends" aria-label="Friends">
            <Users />
          </NavLink>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: 24, width: "100%", overflow: "auto", marginLeft: 84, paddingTop: 72 }}>
        <header
          style={{
            position: "fixed",
            top: 0,
            left: 84,
            right: 0,
            height: 56,
            zIndex: 9,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "0 24px",
            background: "transparent",
            borderBottom: "1px solid #333",
          }}
        >
          <img src="/logo.svg" alt="Hexion logo" style={{ width: 28, height: 28 }} />
          <div style={{ fontSize: 18, fontWeight: 600, color: "#fff", letterSpacing: 0.5 }}>Hexion</div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}