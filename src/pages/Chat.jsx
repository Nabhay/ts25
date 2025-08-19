import React from "react";
import { useNavigate } from "react-router-dom";

// Social: merged Friends + DM Chat in a clean two-column layout
export default function Chat() {
  const user = React.useMemo(() => JSON.parse(localStorage.getItem("currentUser") || "null"), []);

  // Friends and presence
  const [friends, setFriends] = React.useState([]);
  const [incoming, setIncoming] = React.useState([]); // friend requests to me (pending)
  const [outgoing, setOutgoing] = React.useState([]); // friend requests I sent (pending)
  const [search, setSearch] = React.useState("");
  const [addName, setAddName] = React.useState("");
  const navigate = useNavigate();

  // Chat state
  const [activeFriend, setActiveFriend] = React.useState(null);
  const [channelId, setChannelId] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [text, setText] = React.useState("");
  const listEndRef = React.useRef(null);
  const pollRef = React.useRef(null);
  const lastIdRef = React.useRef(0);
  const [visible, setVisible] = React.useState(typeof document !== "undefined" ? document.visibilityState === "visible" : true);

  // Simulated presence / now playing
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

  const loadFriends = React.useCallback(() => {
    if (!user?.username) return;
    fetch(`/api/friends/${user.username}`)
      .then((r) => r.json())
      .then((rows) => setFriends(rows.map((u) => ({ username: u }))))
      .catch(() => setFriends([]));
  }, [user]);

  const loadRequests = React.useCallback(() => {
    if (!user?.username) return;
    fetch(`/api/friend_requests/${user.username}`)
      .then((r) => r.json())
      .then((data) => {
        setIncoming(Array.isArray(data.incoming) ? data.incoming : []);
        setOutgoing(Array.isArray(data.outgoing) ? data.outgoing : []);
      })
      .catch(() => {
        setIncoming([]);
        setOutgoing([]);
      });
  }, [user]);

  React.useEffect(() => { loadFriends(); loadRequests(); }, [loadFriends, loadRequests]);

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

  const addFriend = async () => {
    if (!addName.trim() || !user?.username) return;
    const res = await fetch(`/api/friend_requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: user.username, to: addName.trim() }),
    });
    if (res.ok) {
      setAddName("");
      loadRequests();
    }
  };

  const acceptRequest = async (reqId) => {
    if (!reqId) return;
    const res = await fetch(`/api/friend_requests/${reqId}/accept`, { method: "POST" });
    if (res.ok) {
      loadFriends();
      loadRequests();
    }
  };

  const declineRequest = async (reqId) => {
    if (!reqId) return;
    const res = await fetch(`/api/friend_requests/${reqId}/decline`, { method: "POST" });
    if (res.ok) {
      loadRequests();
    }
  };

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

  const filteredFriends = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((f) => f.username.toLowerCase().includes(q));
  }, [friends, search]);

  return (
    <div style={{ 
      display: "grid", 
      gridTemplateColumns: "320px 1fr", 
      gap: 16, 
  height: "calc(100dvh - 72px - 24px)",
  overflow: "hidden",
      color: "#fff",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      {/* People column */}
      <div style={{ 
        background: "#1f1f1f", 
        border: "1px solid #333", 
        borderRadius: 12, 
        padding: 12, 
        overflow: "auto",
        minHeight: 0
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          marginBottom: 10 
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: 16, 
            color: "#fff" 
          }}>People</h2>
        </div>
        
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends"
            style={{ 
              flex: 1, 
              padding: "8px 10px", 
              borderRadius: 8, 
              border: "1px solid #333", 
              background: "#151515", 
              color: "#fff",
              fontSize: 14
            }}
          />
        </div>
        
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Add friend by username"
            style={{ 
              flex: 1, 
              padding: "8px 10px", 
              borderRadius: 8, 
              border: "1px solid #333", 
              background: "#151515", 
              color: "#fff",
              fontSize: 14
            }}
            onKeyDown={(e) => { if (e.key === "Enter") addFriend(); }}
          />
          <button 
            onClick={addFriend} 
            style={{ 
              borderRadius: 8, 
              padding: "8px 12px", 
              border: "none", 
              background: "#2196f3", 
              color: "#fff", 
              cursor: "pointer",
              fontSize: 14
            }}
          >
            Add
          </button>
        </div>

        {/* Friend Requests */}
        {(incoming.length || outgoing.length) ? (
          <div style={{
            border: "1px solid #333",
            borderRadius: 10,
            padding: 10,
            background: "#111",
            marginBottom: 12
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontWeight: 600, color: "#fff", fontSize: 14 }}>Friend requests</div>
              <div style={{ fontSize: 12, color: "#bbb" }}>
                {incoming.length} incoming • {outgoing.length} outgoing
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {incoming.map((r) => (
                <div key={`in-${r.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ color: "#fff", fontSize: 14 }}>@{r.from} wants to add you</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => acceptRequest(r.id)} style={{ border: "1px solid #333", background: "#151515", color: "#8ef58e", borderRadius: 8, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>Accept</button>
                    <button onClick={() => declineRequest(r.id)} style={{ border: "1px solid #333", background: "#151515", color: "#f58e8e", borderRadius: 8, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>Decline</button>
                  </div>
                </div>
              ))}
              {outgoing.map((r) => (
                <div key={`out-${r.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ color: "#fff", fontSize: 14 }}>Request to @{r.to}</div>
                  <div style={{ color: "#bbb", fontSize: 12 }}>Pending</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredFriends.map((f) => {
            const g = playingMap[f.username] || gamePool[0];
            const isActive = activeFriend === f.username;
            return (
              <div 
                key={f.username} 
                style={{ 
                  border: "1px solid #333", 
                  borderRadius: 10, 
                  padding: 10, 
                  background: isActive ? "#1a1a1a" : "#111",
                  cursor: "pointer"
                }}
                onClick={() => openChat(f)}
              >
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "flex-start", 
                  gap: 8 
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: "50%", 
                      background: "#4caf50", 
                      display: "inline-block" 
                    }} />
                    <div style={{ 
                      fontWeight: 600, 
                      color: "#fff",
                      fontSize: 14
                    }}>@{f.username}</div>
                  </div>
                </div>
                <div style={{ 
                  marginTop: 6, 
                  fontSize: 13, 
                  opacity: 0.9,
                  color: "#fff"
                }}>
                  Playing: {" "}
                  <button
                    title={`View ${g.name}`}
                    onClick={(e) => { e.stopPropagation(); navigate(`/home/games/${g.id}`); }}
                    style={{ 
                      textDecoration: "underline", 
                      color: "#8ab4f8", 
                      background: "transparent", 
                      border: "none", 
                      padding: 0, 
                      cursor: "pointer",
                      fontSize: 13
                    }}
                  >
                    {g.name}
                  </button>
                </div>
              </div>
            );
          })}
          {!filteredFriends.length ? (
            <div style={{ 
              opacity: 0.7, 
              fontSize: 14, 
              color: "#fff" 
            }}>No friends found.</div>
          ) : null}
        </div>
      </div>

      {/* Conversation column */}
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        minHeight: 0,
        background: "#1f1f1f",
        border: "1px solid #333",
        borderRadius: 12,
        padding: 12
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: "1px solid #333"
        }}>
          <h2 style={{ 
            margin: 0,
            color: "#fff",
            fontSize: 18
          }}>
            {activeFriend ? `Chat with @${activeFriend}` : "Select a friend to chat"}
          </h2>
        </div>
        
        <div style={{ 
          flex: 1, 
          minHeight: 0, 
          overflow: "auto", 
          border: "1px solid #333", 
          padding: 12, 
          borderRadius: 12, 
          background: "#0f0f0f" 
        }}>
          {messages.map((m) => (
            <div key={m.id} style={{ marginBottom: 10 }}>
              <div style={{ 
                opacity: 0.65, 
                fontSize: 12,
                color: "#fff"
              }}>
                {new Date(m.createdAt || Date.now()).toLocaleTimeString()}
              </div>
              <div style={{ color: "#fff" }}>
                <strong style={{ color: "#8ab4f8" }}>{m.sender}</strong>: {m.text}
              </div>
            </div>
          ))}
          <div ref={listEndRef} />
        </div>
        
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={activeFriend ? `Message @${activeFriend}` : "Select a friend to chat"}
            style={{ 
              flex: 1, 
              padding: "10px 12px", 
              borderRadius: 10, 
              border: "1px solid #333", 
              background: "#151515", 
              color: "#fff",
              fontSize: 14
            }}
            disabled={!activeFriend}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          />
          <button 
            onClick={send} 
            disabled={!activeFriend} 
            style={{ 
              borderRadius: 10, 
              padding: "10px 14px", 
              background: !activeFriend ? "#333" : "#2196f3", 
              color: "#fff", 
              border: "none", 
              cursor: !activeFriend ? "not-allowed" : "pointer",
              fontSize: 14
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}