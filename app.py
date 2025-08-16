import sqlite3
import os
from typing import List, Optional, Set
from flask import Flask, request, jsonify
from flask_cors import CORS
try:
    import requests
except Exception:
    requests = None
try:
    from dotenv import load_dotenv  
except Exception:
    load_dotenv = None
if load_dotenv:
    load_dotenv()
app = Flask(__name__)
CORS(app)
DB_NAME = "profiles.db"

def ensure_igdb_token() -> Optional[str]:
    token = os.getenv("IGDB_ACCESS_TOKEN")
    if token:
        return token
    client_id = os.getenv("IGDB_CLIENT_ID")
    client_secret = os.getenv("IGDB_CLIENT_SECRET")
    if not client_id or not client_secret or requests is None:
        return None
    try:
        resp = requests.post(
            "https://id.twitch.tv/oauth2/token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "grant_type": "client_credentials",
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        token = data.get("access_token")
        if token:
            os.environ["IGDB_ACCESS_TOKEN"] = token
            return token
    except Exception as ex:
        print("Failed to obtain IGDB token:", ex)
    return None

def game_price(game_id: int) -> float:
    try:
        rng = int(game_id) % 61
    except Exception:
        rng = 0
    price = 9.99 + rng
    return round(price, 2)

def _username_hash(username: str) -> int:
    h = 0
    for ch in username:
        h = (h * 131 + ord(ch)) & 0xFFFFFFFF
    return h

def _placeholder_games_pool() -> List[dict]:
    return [
        {"id": 1001, "name": "Neon Rift"},
        {"id": 1002, "name": "Arcane Runner"},
        {"id": 1003, "name": "Starforge"},
        {"id": 1004, "name": "Shadow Vale"},
        {"id": 1005, "name": "Eclipse Odyssey"},
        {"id": 1006, "name": "Crimson Tactics"},
        {"id": 1007, "name": "Mythic Skies"},
        {"id": 1008, "name": "Quantum Trails"},
        {"id": 1009, "name": "Ironclad Frontier"},
        {"id": 1010, "name": "Solaris Drift"},
        {"id": 1011, "name": "Emberwatch"},
        {"id": 1012, "name": "Frostborn"},
        {"id": 1013, "name": "Warden's Call"},
        {"id": 1014, "name": "Aegis Protocol"},
        {"id": 1015, "name": "Nova Siege"},
        {"id": 1016, "name": "Runebound"},
        {"id": 1017, "name": "Phantom Circuit"},
        {"id": 1018, "name": "Tempest Vale"},
        {"id": 1019, "name": "Golemheart"},
        {"id": 1020, "name": "Starlit Expanse"},
        {"id": 1021, "name": "Echoes of Halcyon"},
        {"id": 1022, "name": "Shattered Spire"},
        {"id": 1023, "name": "Citadel of Glass"},
        {"id": 1024, "name": "Valkyrie's Path"},
        {"id": 1025, "name": "Cobalt Horizon"},
        {"id": 1026, "name": "Axis Breaker"},
        {"id": 1027, "name": "Mirage Strider"},
        {"id": 1028, "name": "Crimson Respite"},
        {"id": 1029, "name": "Basilisk Run"},
        {"id": 1030, "name": "Zephyr Edge"},
    ]

def seed_user_library(username: str, want: int = 10) -> None:
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("SELECT COUNT(1) FROM library WHERE owner_username = ?", (username,))
        count = c.fetchone()[0]
        if count and int(count) > 0:
            conn.close()
            return
        conn.close()
    except Exception:
        return
    picks: List[dict] = []
    client_id = os.getenv("IGDB_CLIENT_ID")
    access_token = ensure_igdb_token()
    if client_id and access_token and requests is not None:
        big_limit = 200
        q = (
            "fields id,name,cover.image_id,total_rating_count; "
            "where cover != null & version_parent = null; "
            f"sort total_rating_count desc; limit {big_limit}; offset 0;"
        )
        try:
            resp = requests.post(
                "https://api.igdb.com/v4/games",
                data=q,
                headers={
                    "Client-ID": client_id,
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json",
                    "Content-Type": "text/plain",
                },
                timeout=12,
            )
            if resp.ok:
                arr = resp.json()
                for g in arr:
                    gid = g.get("id")
                    nm = g.get("name")
                    if gid and nm:
                        picks.append({"id": int(gid), "name": nm})
        except Exception:
            picks = []
    if not picks:
        picks = _placeholder_games_pool()
    h = _username_hash(username)
    start = h % max(1, len(picks))
    selected = []
    for i in range(min(want, len(picks))):
        it = picks[(start + i) % len(picks)]
        selected.append({"id": it["id"], "name": it["name"]})
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        for g in selected:
            c.execute(
                "INSERT INTO library (owner_username, game_id, game_name) VALUES (?, ?, ?)",
                (username, str(g["id"]), g["name"]),
            )
        conn.commit()
        conn.close()
    except Exception:
        pass

@app.route("/store/games", methods=["GET"])
def store_games():
    sort = (request.args.get("sort") or "popularity").lower()
    limit = 200
    try:
        offset = max(0, int(request.args.get("offset", 0)))
    except Exception:
        offset = 0
    client_id = os.getenv("IGDB_CLIENT_ID")
    access_token = ensure_igdb_token()
    if not (client_id and access_token and requests is not None):
        print("[store_games] IGDB not configured (client_id/access_token/requests). Returning empty list.")
        return jsonify([])
    q = (
        "fields id,name,cover.image_id,total_rating,total_rating_count; "
        "where cover != null & version_parent = null; "
        f"sort total_rating_count desc; limit {limit}; offset {offset};"
    )
    try:
        resp = requests.post(
            "https://api.igdb.com/v4/games",
            data=q,
            headers={
                "Client-ID": client_id,
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
                "Content-Type": "text/plain",
            },
            timeout=12,
        )
        if resp.status_code in (401, 403):
            os.environ.pop("IGDB_ACCESS_TOKEN", None)
            access_token2 = ensure_igdb_token()
            if access_token2:
                resp = requests.post(
                    "https://api.igdb.com/v4/games",
                    data=q,
                    headers={
                        "Client-ID": client_id,
                        "Authorization": f"Bearer {access_token2}",
                        "Accept": "application/json",
                        "Content-Type": "text/plain",
                    },
                    timeout=12,
                )
        if not resp.ok:
            print("IGDB store games HTTP", resp.status_code, "->", resp.text[:300])
            if resp.status_code == 400:
                q_fallback = (
                    "fields id,name,cover.image_id,total_rating,total_rating_count; "
                    "where cover != null; "
                    f"sort total_rating_count desc; limit {limit}; offset {offset};"
                )
                resp = requests.post(
                    "https://api.igdb.com/v4/games",
                    data=q_fallback,
                    headers={
                        "Client-ID": client_id,
                        "Authorization": f"Bearer {access_token}",
                        "Accept": "application/json",
                        "Content-Type": "text/plain",
                    },
                    timeout=12,
                )
            if not resp.ok:
                resp.raise_for_status()
        arr = resp.json()
    except Exception as ex:
        print("IGDB store games failed:", ex)
        return jsonify([])
    items = []
    for g in arr:
        cover = (g.get("cover") or {}).get("image_id")
        if not cover:
            continue
        gid = int(g.get("id"))
        items.append(
            {
                "id": gid,
                "name": g.get("name") or f"Game {gid}",
                "coverUrl": f"https://images.igdb.com/igdb/image/upload/t_cover_big/{cover}.jpg",
                "rating": float(g.get("total_rating") or 0.0),
                "popularity": float(g.get("total_rating_count") or 0.0),
                "price": game_price(gid),
            }
        )
    if sort == "price_asc":
        items.sort(key=lambda x: x["price"]) 
    elif sort == "price_desc":
        items.sort(key=lambda x: x["price"], reverse=True) 
    elif sort == "rating":
        items.sort(key=lambda x: (x["rating"]), reverse=True)
    else:
        items.sort(key=lambda x: (x["popularity"]), reverse=True)
    username = request.args.get("username")
    installed_ids: Set[int] = set()
    if username:
        try:
            conn = sqlite3.connect(DB_NAME)
            c = conn.cursor()
            c.execute("SELECT game_id FROM library WHERE owner_username = ?", (username,))
            installed_ids = {int(r[0]) for r in c.fetchall() if str(r[0]).isdigit()}
            conn.close()
        except Exception:
            installed_ids = set()
    if installed_ids:
        for it in items:
            try:
                it["installed"] = int(it["id"]) in installed_ids
            except Exception:
                it["installed"] = False
    else:
        for i, it in enumerate(items):
            it["installed"] = i < 3
    return jsonify(items)


def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT NOT NULL UNIQUE,
            avatar TEXT,
            last_online TEXT,
            bg_from TEXT,
            bg_to TEXT
        )
    """)
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS friends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_username TEXT NOT NULL,
            friend_username TEXT NOT NULL
        )
        """
    )
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS library (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_username TEXT NOT NULL,
            game_id TEXT NOT NULL,
            game_name TEXT NOT NULL
        )
        """
    )
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS channels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_by TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )
        """
    )
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS channel_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            UNIQUE(channel_id, username)
        )
        """
    )
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_id INTEGER NOT NULL,
            sender TEXT NOT NULL,
            text TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )
        """
    )
    conn.commit()
    conn.close()

@app.route("/profiles", methods=["GET"])
def get_profiles():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT name, username, avatar, last_online, bg_from, bg_to FROM profiles")
    rows = c.fetchall()
    conn.close()
    profiles = [
        {
            "name": row[0],
            "username": row[1],
            "avatar": row[2],
            "lastOnline": row[3],
            "bgFrom": row[4],
            "bgTo": row[5],
        }
        for row in rows
    ]
    return jsonify(profiles)

@app.route("/signin", methods=["POST"])
def signin():
    data = request.get_json()
    username = data.get("username")
    if not username:
        return jsonify({"error": "No username provided"}), 400
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("UPDATE profiles SET last_online = 'Online now' WHERE username = ?", (username,))
    conn.commit()
    conn.close()
    print(f"User {username} signed in.")
    if username:
        seed_user_library(username)
    return jsonify({"status": "success", "message": f"User {username} signed in successfully!"})

@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    name = data.get("name")
    username = data.get("username")
    avatar = data.get("avatar")
    bg_from = data.get("bgFrom", "#ff7e5f")
    bg_to = data.get("bgTo", "#feb47b")
    if not name or not username:
        return jsonify({"error": "Name and username are required"}), 400
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    try:
        c.execute("""
            INSERT INTO profiles (name, username, avatar, last_online, bg_from, bg_to)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (name, username, avatar, "Online now", bg_from, bg_to))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Username already exists"}), 400
    conn.close()
    print(f"New user {username} signed up.")
    if username:
        seed_user_library(username)
    return jsonify({
        "status": "success",
        "message": f"User {username} signed up successfully!",
        "user": {
            "name": name,
            "username": username,
            "avatar": avatar,
            "lastOnline": "Online now",
            "bgFrom": bg_from,
            "bgTo": bg_to
        }
    }), 201

@app.route("/games", methods=["GET"])
def games_list():
    try:
        limit = max(1, min(int(request.args.get("limit", 60)), 200))
    except Exception:
        limit = 60
    try:
        offset = max(0, int(request.args.get("offset", 0)))
    except Exception:
        offset = 0
    client_id = os.getenv("IGDB_CLIENT_ID")
    access_token = ensure_igdb_token()
    if client_id and access_token and requests is not None:
        try:
            q = (
                "fields id,name,cover.image_id,total_rating_count; "
                "where cover != null & version_parent = null; "
                f"sort total_rating_count desc; limit {limit}; offset {offset};"
            )
            resp = requests.post(
                "https://api.igdb.com/v4/games",
                data=q,
                headers={
                    "Client-ID": client_id,
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json",
                    "Content-Type": "text/plain",
                },
                timeout=10,
            )
            if resp.status_code in (401, 403):
                os.environ.pop("IGDB_ACCESS_TOKEN", None)
                access_token2 = ensure_igdb_token()
                if access_token2:
                    resp = requests.post(
                        "https://api.igdb.com/v4/games",
                        data=q,
                        headers={
                            "Client-ID": client_id,
                            "Authorization": f"Bearer {access_token2}",
                            "Accept": "application/json",
                            "Content-Type": "text/plain",
                        },
                        timeout=10,
                    )
            if not resp.ok:
                print("IGDB games list HTTP", resp.status_code, "->", resp.text[:300])
                if resp.status_code == 400:
                    q_fallback = (
                        "fields id,name,cover.image_id,total_rating_count; "
                        "where cover != null; "
                        f"sort total_rating_count desc; limit {limit}; offset {offset};"
                    )
                    resp = requests.post(
                        "https://api.igdb.com/v4/games",
                        data=q_fallback,
                        headers={
                            "Client-ID": client_id,
                            "Authorization": f"Bearer {access_token}",
                            "Accept": "application/json",
                            "Content-Type": "text/plain",
                        },
                        timeout=10,
                    )
                if not resp.ok:
                    resp.raise_for_status()
            arr = resp.json()
            out = []
            for g in arr:
                cover = (g.get("cover") or {}).get("image_id")
                if not cover:
                    continue
                out.append(
                    {
                        "id": g.get("id"),
                        "name": g.get("name"),
                        "coverUrl": f"https://images.igdb.com/igdb/image/upload/t_cover_big/{cover}.jpg",
                    }
                )
            username = request.args.get("username")
            installed_ids: Set[int] = set()
            if username:
                try:
                    conn = sqlite3.connect(DB_NAME)
                    c = conn.cursor()
                    c.execute("SELECT game_id FROM library WHERE owner_username = ?", (username,))
                    installed_ids = {int(r[0]) for r in c.fetchall() if str(r[0]).isdigit()}
                    conn.close()
                except Exception:
                    installed_ids = set()
            if not installed_ids:
                for i, it in enumerate(out):
                    it["installed"] = i < 3
            else:
                for it in out:
                    try:
                        it["installed"] = int(it["id"]) in installed_ids
                    except Exception:
                        it["installed"] = False
            return jsonify(out)
        except Exception as ex:
            print("IGDB games list failed:", ex)
            return jsonify([])
    print("[games_list] IGDB not configured. Returning empty list.")
    return jsonify([])

@app.route("/friends/<username>", methods=["GET", "POST"])
def friends(username):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    if request.method == "POST":
        data = request.get_json() or {}
        friend_username = data.get("friend")
        if not friend_username:
            return jsonify({"error": "friend required"}), 400
        c.execute(
            "INSERT INTO friends (owner_username, friend_username) VALUES (?, ?)",
            (username, friend_username),
        )
        conn.commit()
    c.execute(
        "SELECT friend_username FROM friends WHERE owner_username = ?",
        (username,),
    )
    rows = [r[0] for r in c.fetchall()]
    conn.close()
    return jsonify(rows)

@app.route("/library/<username>", methods=["GET", "POST"])
def library(username):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    if request.method == "POST":
        data = request.get_json() or {}
        game_id = data.get("id")
        game_name = data.get("name")
        if not game_id or not game_name:
            return jsonify({"error": "id and name required"}), 400
        c.execute(
            "INSERT INTO library (owner_username, game_id, game_name) VALUES (?, ?, ?)",
            (username, str(game_id), game_name),
        )
        conn.commit()
    c.execute(
        "SELECT game_id, game_name FROM library WHERE owner_username = ?",
        (username,),
    )
    rows = [{"id": r[0], "name": r[1]} for r in c.fetchall()]
    conn.close()
    return jsonify(rows)

@app.route("/channels", methods=["POST"])
def create_channel():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    members = data.get("members") or []
    created_by = (data.get("createdBy") or "").strip()
    if not name:
        return jsonify({"error": "name required"}), 400
    if not created_by:
        return jsonify({"error": "createdBy required"}), 400
    if created_by not in members:
        members.append(created_by)
    members = [m.strip() for m in members if isinstance(m, str) and m.strip()]
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("INSERT INTO channels (name, created_by) VALUES (?, ?)", (name, created_by))
        channel_id = c.lastrowid
        for m in set(members):
            try:
                c.execute("INSERT OR IGNORE INTO channel_members (channel_id, username) VALUES (?, ?)", (channel_id, m))
            except Exception:
                pass
        conn.commit()
        conn.close()
        return jsonify({"id": channel_id, "name": name})
    except Exception as ex:
        print("create_channel failed:", ex)
        return jsonify({"error": "failed"}), 500

@app.route("/channels/<username>", methods=["GET"])
def list_channels(username):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute(
        """
        SELECT channels.id, channels.name
        FROM channels
        JOIN channel_members ON channels.id = channel_members.channel_id
        WHERE channel_members.username = ?
        ORDER BY channels.id DESC
        """,
        (username,),
    )
    out = [{"id": r[0], "name": r[1]} for r in c.fetchall()]
    conn.close()
    return jsonify(out)

@app.route("/channels/<int:channel_id>/members", methods=["GET", "POST"])
def channel_members_route(channel_id: int):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    if request.method == "POST":
        data = request.get_json() or {}
        username = (data.get("username") or "").strip()
        if not username:
            conn.close()
            return jsonify({"error": "username required"}), 400
        try:
            c.execute("INSERT OR IGNORE INTO channel_members (channel_id, username) VALUES (?, ?)", (channel_id, username))
            conn.commit()
        except Exception as ex:
            print("add member failed:", ex)
            conn.close()
            return jsonify({"error": "failed"}), 500
    c.execute("SELECT username FROM channel_members WHERE channel_id = ? ORDER BY username", (channel_id,))
    rows = [r[0] for r in c.fetchall()]
    conn.close()
    return jsonify(rows)

@app.route("/channels/<int:channel_id>/messages", methods=["GET", "POST"])
def channel_messages(channel_id: int):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    if request.method == "POST":
        data = request.get_json() or {}
        sender = (data.get("sender") or "").strip()
        text = (data.get("text") or "").strip()
        if not sender or not text:
            conn.close()
            return jsonify({"error": "sender and text required"}), 400
        try:
            c.execute(
                "INSERT INTO messages (channel_id, sender, text) VALUES (?, ?, ?)",
                (channel_id, sender, text),
            )
            conn.commit()
        except Exception as ex:
            print("insert message failed:", ex)
            conn.close()
            return jsonify({"error": "failed"}), 500
    since_id = request.args.get("sinceId")
    if since_id and str(since_id).isdigit():
        c.execute(
            "SELECT id, sender, text, created_at FROM messages WHERE channel_id = ? AND id > ? ORDER BY id ASC",
            (channel_id, int(since_id)),
        )
    else:
        c.execute(
            "SELECT id, sender, text, created_at FROM messages WHERE channel_id = ? ORDER BY id DESC LIMIT 50",
            (channel_id,),
        )
    rows = c.fetchall()
    conn.close()
    if not (since_id and str(since_id).isdigit()):
        rows = list(reversed(rows))
    out = [
        {"id": r[0], "sender": r[1], "text": r[2], "createdAt": r[3]}
        for r in rows
    ]
    return jsonify(out)

@app.route("/games/<game_id>")
def game_details(game_id):
    client_id = os.getenv("IGDB_CLIENT_ID")
    access_token = ensure_igdb_token()
    if client_id and access_token and requests is not None:
        try:
            q = f"fields name,summary,screenshots.image_id,videos.video_id; where id = {int(game_id)};"
            resp = requests.post(
                "https://api.igdb.com/v4/games",
                data=q,
                headers={
                    "Client-ID": client_id,
                    "Authorization": f"Bearer {access_token}",
                },
                timeout=8,
            )
            resp.raise_for_status()
            arr = resp.json()
            if arr:
                g = arr[0]
                images: List[str] = []
                for s in (g.get("screenshots") or []):
                    image_id = s.get("image_id")
                    if image_id:
                        images.append(f"https://images.igdb.com/igdb/image/upload/t_screenshot_big/{image_id}.jpg")
                video_url = None
                vids = g.get("videos") or []
                if vids:
                    vid = vids[0]
                    yid = vid.get("video_id")
                    if yid:
                        video_url = f"https://www.youtube.com/embed/{yid}"
                return jsonify(
                    {
                        "id": game_id,
                        "name": g.get("name") or f"Game {game_id}",
                        "summary": g.get("summary") or "",
                        "screenshots": images or [
                            "https://placehold.co/600x338/444/FFF?text=Gameplay+1"
                        ],
                        "videoUrl": video_url,
                    }
                )
        except Exception as ex:
            print("IGDB fetch failed:", ex)
    return jsonify({
        "id": game_id,
        "name": f"Game {game_id}",
        "summary": "Mock summary. Plug IGDB here.",
        "screenshots": [
            "https://placehold.co/600x338/444/FFF?text=Gameplay+1",
            "https://placehold.co/600x338/555/FFF?text=Gameplay+2",
        ],
        "videoUrl": None,
    })

@app.route("/debug/igdb", methods=["GET"])
def debug_igdb():
    status = {
        "has_requests": requests is not None,
        "has_client_id": bool(os.getenv("IGDB_CLIENT_ID")),
        "has_client_secret": bool(os.getenv("IGDB_CLIENT_SECRET")),
        "has_access_token_env": bool(os.getenv("IGDB_ACCESS_TOKEN")),
    }
    if requests is not None:
        token = ensure_igdb_token()
        status["can_fetch_token"] = bool(token)
    else:
        status["can_fetch_token"] = False
    return jsonify(status)

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=4000, debug=False)
