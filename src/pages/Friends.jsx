import React from "react";
import { useNavigate } from "react-router-dom";

export default function Friends() {
  const user = JSON.parse(localStorage.getItem("currentUser") || "null");
  const [friends, setFriends] = React.useState([]);
  const [name, setName] = React.useState("");
  const [activeFriend, setActiveFriend] = React.useState(null);
  const [channelId, setChannelId] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [text, setText] = React.useState("");
  const pollRef = React.useRef(null);
  const listEndRef = React.useRef(null);
  const lastIdRef = React.useRef(0);
  const [visible, setVisible] = React.useState(typeof document !== "undefined" ? document.visibilityState === "visible" : true);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) return;
    fetch(`/api/friends/${user.username}`)
      .then((r) => r.json())
      .then((rows) => setFriends(rows.map((u) => ({ username: u }))))
      .catch(() => setFriends([]));
  }, [user]);

  const add = async () => {
    if (!name.trim() || !user) return;
    const res = await fetch(`/api/friends/${user.username}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friend: name }),
    });
    if (res.ok) {
      setFriends((f) => [...f, { username: name }]);
      setName("");
    }
  };

  const gamePool = React.useMemo(
    () => [
      { id: 1001, name: "Neon Rift" },
      { id: 1002, name: "Arcane Runner" },
      { id: 1003, name: "Starforge" },
      { id: 1004, name: "Shadow Vale" },
      { id: 1005, name: "Eclipse Odyssey" },
      { id: 1006, name: "Crimson Tactics" },
    ],
    []
  );
  const [playingMap, setPlayingMap] = React.useState({});
  const rngPick = React.useCallback(() => gamePool[Math.floor(Math.random() * gamePool.length)], [gamePool]);
  React.useEffect(() => {
    if (!friends.length) return;
    setPlayingMap((prev) => {
      const next = { ...prev };
      for (const f of friends) {
        if (!next[f.username]) next[f.username] = rngPick();
      }
      return next;
    });
  }, [friends, rngPick]);

  const ensureDmChannel = async (friendName) => {
    if (!user?.username || !friendName) return null;
    const a = user.username;
    const b = friendName;
    const dmName = `dm:${[a, b].sort().join(",")}`;
    const res = await fetch(`/api/channels/${encodeURIComponent(user.username)}`);
    const chans = await res.json();
    let dm = chans.find((c) => c.name === dmName);
    if (!dm) {
      const cRes = await fetch(`/api/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: dmName, createdBy: user.username, members: [friendName] }),
      });
      if (cRes.ok) dm = await cRes.json();
    }
    return dm?.id || null;
  };

  const loadMessages = React.useCallback(async () => {
    if (!channelId) return;
    const res = await fetch(`/api/channels/${channelId}/messages`);
    const list = await res.json();
    setMessages(list);
  }, [channelId]);

  React.useEffect(() => { loadMessages(); }, [loadMessages]);

  React.useEffect(() => { lastIdRef.current = messages.length ? messages[messages.length - 1].id : 0; }, [messages]);

  React.useEffect(() => {
    const handler = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  React.useEffect(() => {
    if (!channelId || !visible) return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/channels/${channelId}/messages?sinceId=${lastIdRef.current}`);
      if (res.ok) {
        const more = await res.json();
        if (more.length) setMessages((prev) => [...prev, ...more]);
      }
    }, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [channelId, visible]);

  React.useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openChat = async (friend) => {
    setActiveFriend(friend.username);
    const id = await ensureDmChannel(friend.username);
    setChannelId(id);
  };

  const send = async () => {
    if (!text.trim() || !channelId || !user?.username) return;
    await fetch(`/api/channels/${channelId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: user.username, text }),
    });
    setText("");
    const lastId = messages.length ? messages[messages.length - 1].id : 0;
    const res = await fetch(`/api/channels/${channelId}/messages?sinceId=${lastId}`);
    const more = await res.json();
    setMessages((prev) => [...prev, ...more]);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12, height: "100dvh", minHeight: "100vh" }}>
      <div style={{ borderRight: "1px solid #333", paddingRight: 12, overflow: "auto" }}>
        <h1 style={{ marginTop: 0 }}>Friends</h1>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add friend by username" style={{ flex: 1 }} />
          <button onClick={add}>Add</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {friends.map((f, i) => {
            const g = playingMap[f.username] || gamePool[0];
            const isActive = activeFriend === f.username;
            return (
              <div key={i} style={{ border: "1px solid #333", borderRadius: 10, padding: 10, background: isActive ? "#1a1a1a" : "#111" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontWeight: 600 }}>@{f.username}</div>
                  <button onClick={() => openChat(f)} style={{ border: "1px solid #333", background: "#151515", color: "#fff", borderRadius: 8, padding: "4px 8px" }}>Chat</button>
                </div>
                <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>
                  Playing: {" "}
                  <button
                    title={`View ${g.name}`}
                    onClick={() => navigate(`/home/games/${g.id}`)}
                    style={{
                      textDecoration: "underline",
                      color: "#8ab4f8",
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    {g.name}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <h2 style={{ marginTop: 0 }}>{activeFriend ? `Chat with @${activeFriend}` : "Select a friend to chat"}</h2>
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
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={activeFriend ? `Message @${activeFriend}` : "Select a friend to chat"}
            style={{ flex: 1 }}
            disabled={!activeFriend}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          />
          <button onClick={send} disabled={!activeFriend}>Send</button>
        </div>
      </div>
    </div>
  );
}
