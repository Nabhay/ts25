import React from "react";

export default function Chat() {
  const [channels, setChannels] = React.useState([]);
  const [activeId, setActiveId] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [text, setText] = React.useState("");
  const [newName, setNewName] = React.useState("");
  const [newMembers, setNewMembers] = React.useState("");
  const [members, setMembers] = React.useState([]);
  const [addMember, setAddMember] = React.useState("");
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  const pollRef = React.useRef(null);
  const listEndRef = React.useRef(null);
  const lastIdRef = React.useRef(0);
  const [visible, setVisible] = React.useState(typeof document !== "undefined" ? document.visibilityState === "visible" : true);

  const user = React.useMemo(() => JSON.parse(localStorage.getItem("currentUser") || "null"), []);

  const loadChannels = React.useCallback(async () => {
    if (!user?.username) return;
    const res = await fetch(`/api/channels/${encodeURIComponent(user.username)}`);
    const list = await res.json();
    setChannels(list);
    if (!activeId && list.length) setActiveId(list[0].id);
  }, [user, activeId]);

  React.useEffect(() => { loadChannels(); }, [loadChannels]);

  const loadMessages = React.useCallback(async () => {
    if (!activeId) return;
    const res = await fetch(`/api/channels/${activeId}/messages`);
    const list = await res.json();
    setMessages(list.slice().reverse());
  }, [activeId]);

  React.useEffect(() => { loadMessages(); }, [loadMessages]);

  React.useEffect(() => {
    lastIdRef.current = messages.length ? messages[messages.length - 1].id : 0;
  }, [messages]);

  React.useEffect(() => {
    const handler = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  const loadMembers = React.useCallback(async () => {
    if (!activeId) return;
    const res = await fetch(`/api/channels/${activeId}/members`);
    const list = await res.json();
    setMembers(list);
  }, [activeId]);

  React.useEffect(() => { loadMembers(); }, [loadMembers]);

  React.useEffect(() => {
    if (!activeId || !visible) return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/channels/${activeId}/messages?sinceId=${lastIdRef.current}`);
      if (res.ok) {
        const more = await res.json();
        if (more.length) setMessages((prev) => [...prev, ...more]);
      }
    }, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeId, visible]);

  React.useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !activeId || !user?.username) return;
    await fetch(`/api/channels/${activeId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: user.username, text }),
    });
    setText("");
    const lastId = messages.length ? messages[messages.length - 1].id : 0;
    const res = await fetch(`/api/channels/${activeId}/messages?sinceId=${lastId}`);
    const more = await res.json();
    setMessages((prev) => [...prev, ...more]);
  };

  const createChannel = async () => {
    if (!newName.trim() || !user?.username) return;
    const members = newMembers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch(`/api/channels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), createdBy: user.username, members }),
    });
    if (res.ok) {
      setNewName("");
      setNewMembers("");
      await loadChannels();
      setShowCreateModal(false);
    }
  };

  return (
    <>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr 260px",
        gap: 12,
        height: "100dvh",
        minHeight: "100vh",
      }}
    >
    <div style={{ borderRight: "1px solid #333", paddingRight: 12, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <h2 style={{ margin: 0 }}>Channels</h2>
          <button
            title="Create channel"
            onClick={() => setShowCreateModal(true)}
            style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        border: "1px solid #444",
        background: "#151515",
        color: "#fff",
        fontSize: 22,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
            }}
          >
            +
          </button>
        </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8, height: "calc(100% - 56px)", overflow: "auto", paddingRight: 6 }}>
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveId(ch.id)}
              style={{
                textAlign: "left",
                padding: "8px 10px",
                borderRadius: 8,
        border: "1px solid #333",
        background: activeId === ch.id ? "#222" : "#111",
                color: "#fff",
              }}
            >
              #{ch.name}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <h2 style={{ marginTop: 0 }}>{activeId ? `Channel #${activeId}` : "Select a channel"}</h2>
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", border: "1px solid #333", padding: 8, borderRadius: 8, background: "#0f0f0f" }}>
          {messages.map((m) => (
            <div key={m.id} style={{ marginBottom: 8 }}>
              <div style={{ opacity: 0.8, fontSize: 12 }}>{new Date(m.createdAt || Date.now()).toLocaleTimeString()}</div>
              <div>
                <strong>{m.sender}:</strong> {m.text}
              </div>
            </div>
          ))}
          <div ref={listEndRef} />
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => alert("Joining voice call (placeholder)")}
            title="Join voice call"
            style={{ border: "1px solid #333", background: "#111", color: "#fff", borderRadius: 8, padding: "6px 10px" }}
          >
            Join voice call
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message"
            style={{ flex: 1 }}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <button onClick={send} disabled={!activeId}>Send</button>
        </div>
      </div>

  <div style={{ overflow: "auto" }}>
        <h3 style={{ marginTop: 0 }}>Members</h3>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: 320, overflow: "auto" }}>
          {members.map((m) => (
            <li key={m} style={{ padding: "6px 8px", border: "1px solid #333", borderRadius: 6, marginBottom: 6 }}>{m}</li>
          ))}
          {!members.length && <li style={{ opacity: 0.7 }}>No members</li>}
        </ul>
        <div style={{ marginTop: 10 }}>
          <input
            placeholder="Add member by username"
            value={addMember}
            onChange={(e) => setAddMember(e.target.value)}
            style={{ width: "100%", marginBottom: 6 }}
          />
          <button
            disabled={!activeId || !addMember.trim()}
            onClick={async () => {
              if (!activeId || !addMember.trim()) return;
              const res = await fetch(`/api/channels/${activeId}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: addMember.trim() }),
              });
              if (res.ok) {
                setAddMember("");
                await loadMembers();
              }
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
    {showCreateModal && (
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
        onClick={() => setShowCreateModal(false)}
      >
        <div
          style={{ background: "#0f0f0f", border: "1px solid #333", borderRadius: 10, padding: 16, width: 420 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ marginTop: 0 }}>Create channel</h3>
          <input
            autoFocus
            placeholder="Channel name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <input
            placeholder="Members (comma-separated usernames)"
            value={newMembers}
            onChange={(e) => setNewMembers(e.target.value)}
            style={{ width: "100%", marginBottom: 12 }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={() => setShowCreateModal(false)} style={{ background: "#111", color: "#fff", border: "1px solid #333", borderRadius: 8, padding: "6px 10px" }}>Cancel</button>
            <button onClick={createChannel} style={{ background: "#1f6feb", color: "#fff", border: "1px solid #1f6feb", borderRadius: 8, padding: "6px 10px" }}>Create</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
