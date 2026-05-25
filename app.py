import os
import json
import psycopg2
import requests

from flask import Flask, request, jsonify
from dotenv import load_dotenv
from groq import Groq
from flask_cors import CORS
from datetime import datetime
from gtts import gTTS
import uuid
from flask import Flask, render_template
import cloudinary
import cloudinary.uploader
from langdetect import detect
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

# =========================================
# LOAD ENV
# =========================================
load_dotenv()

# =========================================
# FLASK
# =========================================
app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return jsonify({"message": "Backend running"})


# =========================================
# GROQ
# =========================================
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# =========================================
# CLOUDINARY
# =========================================
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

# =========================================
# PINECONE
# =========================================
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("realestate")

# =========================================
# EMBEDDING MODEL
# =========================================
embed_model = SentenceTransformer("all-MiniLM-L6-v2")


def create_embedding(text):
    return embed_model.encode(text).tolist()


# =========================================
# DATABASE
# =========================================
conn = psycopg2.connect(os.getenv("DATABASE_URL"))

conn.autocommit = True
cursor = conn.cursor()

VOICE_LANG_MAP = {
    "ENGLISH": "en",
    "HINDI": "hi",
    "TAMIL": "ta",
    "TELUGU": "te",
    "KANNADA": "kn",
}


# =========================================
# 10 ASSISTANT ROUTER  (shared helper)
# =========================================


def detect_assistant_type(msg):
    """
    Returns one of 10 assistant type strings based on the user message.
    Called by both /voice-reply and /chat before building context.
    """
    query = msg.lower()

    # 1 PROPERTY SEARCH
    if any(
        x in query
        for x in [
            "property",
            "pg",
            "1bhk",
            "2bhk",
            "villa",
            "rent",
            "house",
            "flat",
            "apartment",
            "room",
            "studio",
            "hostel",
            "accommodation",
        ]
    ):
        return "property"

    # 2 VISIT ASSISTANT
    elif any(
        x in query
        for x in [
            "visit",
            "visits",
            "visited",
            "booked visit",
            "scheduled visit",
            "my visits",
            "visit history",
            "confirmed visit",
            "cancel visit",
            "next visit",
            "upcoming visit",
        ]
    ):
        return "visit"

    # 3 LIKED / SAVED PROPERTIES
    elif any(
        x in query
        for x in [
            "liked",
            "saved",
            "favorites",
            "favourite",
            "wishlist",
            "shortlisted",
            "bookmarked",
        ]
    ):
        return "liked"

    # 4 MESSAGE OWNER
    elif any(
        x in query
        for x in [
            "message",
            "owner",
            "contact owner",
            "msg",
            "inbox",
            "sent message",
            "received message",
        ]
    ):
        return "message"

    # 5 ROOMMATE ASSISTANT
    elif any(
        x in query
        for x in [
            "roommate",
            "sharing",
            "shared room",
            "co-tenant",
            "flatmate",
            "room sharing",
        ]
    ):
        return "roommate"

    # 6 MATCH / COMPATIBILITY ASSISTANT
    elif any(
        x in query
        for x in [
            "match",
            "compatible",
            "compatibility",
            "best match",
            "find roommate",
            "who matches",
        ]
    ):
        return "match"

    # 7 ADVERTISEMENT ASSISTANT
    elif any(
        x in query
        for x in [
            "advertisement",
            "ad",
            "promote",
            "listing",
            "post property",
            "advertise",
            "generate ad",
        ]
    ):
        return "ad"

    # 8 MOVE-IN ASSISTANT
    elif any(
        x in query
        for x in [
            "move",
            "shift",
            "move in",
            "moving",
            "shifting",
            "checklist",
            "move-in",
            "relocation",
        ]
    ):
        return "movein"

    # 9 SUBSCRIPTION ASSISTANT
    elif any(
        x in query
        for x in [
            "subscription",
            "plan",
            "upgrade",
            "premium",
            "pricing",
            "subscribe",
            "my plan",
            "renew",
        ]
    ):
        return "subscription"

    # 10 PROPERTY COMPARISON
    elif any(
        x in query
        for x in [
            "compare",
            "comparison",
            "better",
            "difference",
            "vs",
            "which is better",
            "best option",
        ]
    ):
        return "compare"

    # DEFAULT → property search
    return "property"


# =========================================
# BUILD CONTEXT PER ASSISTANT (shared helper)
# =========================================


def build_context(uid, msg, assistant_type):
    """
    Fetches the relevant database / Pinecone context for each assistant type.
    Returns a plain-text context string that is fed to the AI.
    """
    context = ""
    query = msg.lower()

    # ------------------------------------------------------------------
    # 1  PROPERTY SEARCH
    # ------------------------------------------------------------------
    if assistant_type == "property":

        smart_query = query

        if "girls" in smart_query:
            smart_query += " girls pg"
        if "boys" in smart_query:
            smart_query += " boys pg"
        if "food" in smart_query:
            smart_query += " food included"
        if "2bhk" in smart_query:
            smart_query += " 2bhk"
        if "1bhk" in smart_query:
            smart_query += " 1bhk"
        if "chennai" in smart_query:
            smart_query += " chennai"

        # user preference enrichment
        cursor.execute(
            """
            SELECT city, locality, "preferredTenant", "foodIncluded", "rentMin", "rentMax"
            FROM "UserPreference"
            WHERE "userId"=%s
            ORDER BY id DESC LIMIT 1
        """,
            (uid,),
        )
        pref = cursor.fetchone()
        if pref:
            if pref[0]:
                smart_query += f" {pref[0]}"
            if pref[1]:
                smart_query += f" {pref[1]}"
            if pref[2]:
                smart_query += f" {pref[2]}"
            if pref[3]:
                smart_query += " food included"

        results = call_mcp_tool("search-properties", {"query": smart_query})

        for m in results.get("matches", []):
            meta = m.get("metadata", {})
            context += f"""
Property : {meta.get('propertyName')}
City     : {meta.get('city')}
Locality : {meta.get('locality')}
Type     : {meta.get('propertyType')}
"""
        if not context.strip():
            context = "No matching properties found."

    # ------------------------------------------------------------------
    # 2  VISIT ASSISTANT
    # ------------------------------------------------------------------
    elif assistant_type == "visit":

        if "cancel" in query:
            cursor.execute(
                """
                UPDATE "Visit"
                SET status='cancelled'
                WHERE id=(
                    SELECT id FROM "Visit"
                    WHERE "userId"=%s AND status!='cancelled'
                    ORDER BY "visitDateTime" DESC LIMIT 1
                )
            """,
                (uid,),
            )
            context = "Your latest visit has been cancelled successfully."

        elif "confirmed" in query:
            cursor.execute(
                """
                SELECT p."propertyName", p.city, p.locality, p."propertyType",
                       v."visitDateTime", v.status
                FROM "Visit" v
                JOIN "Property" p ON p.id = v."propertyId"
                WHERE v."userId"=%s AND v.status='confirmed'
                ORDER BY v."visitDateTime" ASC
            """,
                (uid,),
            )
            rows = cursor.fetchall()
            if rows:
                for r in rows:
                    context += f"\nProperty: {r[0]} | City: {r[1]} | Locality: {r[2]} | Type: {r[3]} | Time: {r[4]} | Status: {r[5]}"
            else:
                context = "No confirmed visits found."

        elif "next" in query or "upcoming" in query:
            cursor.execute(
                """
                SELECT p."propertyName", p.city, p.locality, p."propertyType",
                       v."visitDateTime", v.status
                FROM "Visit" v
                JOIN "Property" p ON p.id = v."propertyId"
                WHERE v."userId"=%s AND v."visitDateTime" >= NOW()
                ORDER BY v."visitDateTime" ASC LIMIT 1
            """,
                (uid,),
            )
            rows = cursor.fetchall()
            if rows:
                for r in rows:
                    context += f"\nProperty: {r[0]} | City: {r[1]} | Locality: {r[2]} | Type: {r[3]} | Time: {r[4]} | Status: {r[5]}"
            else:
                context = "No upcoming visits found."

        elif "chennai" in query:
            cursor.execute(
                """
                SELECT p."propertyName", p.city, p.locality, p."propertyType",
                       v."visitDateTime", v.status
                FROM "Visit" v
                JOIN "Property" p ON p.id = v."propertyId"
                WHERE v."userId"=%s AND LOWER(p.city)='chennai'
                ORDER BY v."visitDateTime" DESC
            """,
                (uid,),
            )
            rows = cursor.fetchall()
            if rows:
                for r in rows:
                    context += f"\nProperty: {r[0]} | City: {r[1]} | Locality: {r[2]} | Type: {r[3]} | Time: {r[4]} | Status: {r[5]}"
            else:
                context = "No Chennai visits found."

        else:
            cursor.execute(
                """
                SELECT p."propertyName", p.city, p.locality, p."propertyType",
                       v."visitDateTime", v.status
                FROM "Visit" v
                JOIN "Property" p ON p.id = v."propertyId"
                WHERE v."userId"=%s
                ORDER BY v."visitDateTime" DESC
            """,
                (uid,),
            )
            rows = cursor.fetchall()
            if rows:
                for r in rows:
                    context += f"\nProperty: {r[0]} | City: {r[1]} | Locality: {r[2]} | Type: {r[3]} | Time: {r[4]} | Status: {r[5]}"
            else:
                context = "No visit history found."

    # ------------------------------------------------------------------
    # 3  LIKED / SAVED PROPERTIES
    # ------------------------------------------------------------------
    elif assistant_type == "liked":

        cursor.execute(
            """
            SELECT p."propertyName", p.city, p.locality, p."propertyType", l."createdAt"
            FROM "Like" l
            JOIN "Property" p ON p.id = l."propertyId"
            WHERE l."userId"=%s
            ORDER BY l."createdAt" DESC
        """,
            (uid,),
        )
        rows = cursor.fetchall()
        if rows:
            for r in rows:
                context += f"\nProperty: {r[0]} | City: {r[1]} | Locality: {r[2]} | Type: {r[3]} | Saved on: {r[4]}"
        else:
            context = "No saved / liked properties found."

    # ------------------------------------------------------------------
    # 4  MESSAGE ASSISTANT
    # ------------------------------------------------------------------
    elif assistant_type == "message":

        cursor.execute(
            """
            SELECT m.message, m."createdAt",
                   p."propertyName",
                   u.name AS receiver_name
            FROM "Message" m
            JOIN "Property" p ON p.id = m."propertyId"
            JOIN "User" u     ON u.id = m."receiverId"
            WHERE m."senderId"=%s
            ORDER BY m."createdAt" DESC
            LIMIT 10
        """,
            (uid,),
        )
        rows = cursor.fetchall()
        if rows:
            for r in rows:
                context += (
                    f"\nMessage: {r[0]} | Property: {r[2]} | To: {r[3]} | At: {r[1]}"
                )
        else:
            context = "No messages sent by you found."

    # ------------------------------------------------------------------
    # 5  ROOMMATE ASSISTANT
    # ------------------------------------------------------------------
    elif assistant_type == "roommate":

        cursor.execute(
            """
            SELECT "sharingTypes", "createdAt"
            FROM "UserPreference"
            WHERE "userId"=%s
            ORDER BY id DESC LIMIT 1
        """,
            (uid,),
        )
        row = cursor.fetchone()
        if row:
            prefs = row[0]
            if isinstance(prefs, str):
                prefs = json.loads(prefs)
            context = f"Your roommate preferences:\n{json.dumps(prefs, indent=2)}"
        else:
            context = (
                "No roommate preferences saved. Please set your preferences first."
            )

    # ------------------------------------------------------------------
    # 6  MATCH / COMPATIBILITY ASSISTANT
    # ------------------------------------------------------------------
    elif assistant_type == "match":

        cursor.execute(
            """
            SELECT "sharingTypes"
            FROM "UserPreference"
            WHERE "userId"=%s
            ORDER BY id DESC LIMIT 1
        """,
            (uid,),
        )
        current = cursor.fetchone()

        if not current:
            context = "You have not saved roommate preferences yet."
        else:
            current_data = current[0]
            if isinstance(current_data, str):
                current_data = json.loads(current_data)

            cursor.execute(
                """
                SELECT u.id, u.name, u.mobile, p."sharingTypes"
                FROM "UserPreference" p
                JOIN "User" u ON u.id = p."userId"
                WHERE u.id != %s
            """,
                (uid,),
            )
            rows = cursor.fetchall()

            fields = [
                "sleepTiming",
                "foodHabit",
                "smoking",
                "drinking",
                "occupation",
                "petFriendly",
                "cleaningFrequency",
            ]
            matches_found = []

            for row in rows:
                other_data = row[3]
                if isinstance(other_data, str):
                    other_data = json.loads(other_data)
                if not isinstance(other_data, dict):
                    continue
                score = sum(
                    2 for f in fields if current_data.get(f) == other_data.get(f)
                )
                if score >= 5:
                    matches_found.append(
                        {"name": row[1], "mobile": row[2], "score": score}
                    )

            matches_found.sort(key=lambda x: x["score"], reverse=True)

            if matches_found:
                for m in matches_found[:5]:
                    context += f"\nName: {m['name']} | Mobile: {m['mobile']} | Score: {m['score']}/14"
            else:
                context = "No compatible roommate matches found yet."

    # ------------------------------------------------------------------
    # 7  ADVERTISEMENT ASSISTANT
    # ------------------------------------------------------------------
    elif assistant_type == "ad":

        cursor.execute(
            """
            SELECT p."propertyName", p.city, p.locality, p."propertyType",
                   p.parking, u.name, u.mobile
            FROM "Property" p
            JOIN "User" u ON u.id = p."userId"
            WHERE p."userId"=%s
            ORDER BY p."createdAt" DESC LIMIT 1
        """,
            (uid,),
        )
        row = cursor.fetchone()
        if row:
            context = (
                f"Property: {row[0]} | City: {row[1]} | Locality: {row[2]} "
                f"| Type: {row[3]} | Parking: {row[4]} "
                f"| Owner: {row[5]} | Contact: {row[6]}"
            )
        else:
            context = "No property found to generate an advertisement for."

    # ------------------------------------------------------------------
    # 8  MOVE-IN ASSISTANT
    # ------------------------------------------------------------------
    elif assistant_type == "movein":

        cursor.execute(
            """
            SELECT p."propertyName", p.city, p.locality, p."propertyType"
            FROM "Property" p
            JOIN "Visit" v ON v."propertyId" = p.id
            WHERE v."userId"=%s AND v.status='confirmed'
            ORDER BY v."visitDateTime" DESC LIMIT 1
        """,
            (uid,),
        )
        row = cursor.fetchone()
        if row:
            suggestions = [
                f"Deep clean before moving in to {row[0]}.",
                f"Check locality {row[2]}, {row[1]} for nearby essentials.",
                "Arrange electricity and water setup on day 1.",
            ]
            ptype = str(row[3]).lower()
            if "pg" in ptype:
                suggestions.append("Confirm WiFi, shared washroom, and meal timings.")
            elif "1bhk" in ptype:
                suggestions.append("Use compact furniture to maximise space.")
            elif "2bhk" in ptype:
                suggestions.append("Plan room-wise shifting for smoother move.")
            elif "villa" in ptype:
                suggestions.append("Inspect parking, garden, and security gate.")
            context = "\n".join(suggestions)
        else:
            context = (
                "General move-in checklist:\n"
                "1. Deep clean before moving.\n"
                "2. Set up electricity and water.\n"
                "3. Check internet and gas connections.\n"
                "4. Inspect locks and safety.\n"
                "5. Meet neighbours and building manager."
            )

    # ------------------------------------------------------------------
    # 9  SUBSCRIPTION ASSISTANT
    # ------------------------------------------------------------------
    elif assistant_type == "subscription":

        try:
            cursor.execute(
                """
                SELECT plan, status, "startDate", "endDate"
                FROM "Subscription"
                WHERE "userId"=%s
                ORDER BY "startDate" DESC LIMIT 1
            """,
                (uid,),
            )
            row = cursor.fetchone()
            if row:
                context = (
                    f"Plan: {row[0]} | Status: {row[1]} "
                    f"| Start: {row[2]} | End: {row[3]}"
                )
            else:
                context = "No active subscription found. Please upgrade to a plan."
        except Exception:
            context = "Subscription data not available right now."

    # ------------------------------------------------------------------
    # 10  PROPERTY COMPARISON
    # ------------------------------------------------------------------
    elif assistant_type == "compare":

        cursor.execute(
            """
            SELECT p."propertyName", p.city, p.locality, p."propertyType",
                   p.parking, l."createdAt"
            FROM "Like" l
            JOIN "Property" p ON p.id = l."propertyId"
            WHERE l."userId"=%s
            ORDER BY l."createdAt" DESC LIMIT 2
        """,
            (uid,),
        )
        rows = cursor.fetchall()
        if len(rows) >= 2:
            context = "Comparing your last 2 saved properties:\n"
            for i, r in enumerate(rows, 1):
                context += (
                    f"\nOption {i}: {r[0]} | City: {r[1]} | Locality: {r[2]} "
                    f"| Type: {r[3]} | Parking: {r[4]}"
                )
        elif len(rows) == 1:
            context = "Only one saved property found. Save at least two properties to compare."
        else:
            context = "No saved properties found to compare."

    return context


# =========================================
# CHECK USER
# =========================================
@app.route("/check-user/<int:uid>", methods=["GET"])
def check_user(uid):

    try:
        cursor.execute('SELECT id FROM "User" WHERE id=%s', (uid,))
        user = cursor.fetchone()
        if user:
            return jsonify({"exists": True})
        else:
            return jsonify({"exists": False})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================
# VOICE REPLY
# =========================================
@app.route("/voice-reply", methods=["POST"])
def voice_reply():

    try:
        data = request.json
        uid = data["userId"]
        msg = data["message"]

        print("USER:", uid)
        print("MESSAGE:", msg)

        # =====================================
        # CHECK USER EXISTS
        # =====================================
        cursor.execute('SELECT id, name FROM "User" WHERE id=%s', (uid,))
        existing_user = cursor.fetchone()
        if not existing_user:
            return jsonify({"error": "invalid user"}), 404

        # =====================================
        # LANGUAGE DETECTION
        # =====================================
        user_language = detect_language(msg)
        save_chat(uid, "user", msg)

        # =====================================
        # 10 ASSISTANT ROUTER
        # =====================================
        assistant_type = detect_assistant_type(msg)
        print("ASSISTANT TYPE:", assistant_type)

        # =====================================
        # BUILD CONTEXT FROM DATABASE / PINECONE
        # =====================================
        context = build_context(uid, msg, assistant_type)

        # =====================================
        # AI RESPONSE
        # =====================================
        res = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            temperature=0.2,
            messages=[
                {
                    "role": "system",
                    "content": f"""
You are RentIt AI voice assistant.

Current assistant: {assistant_type}

Supported assistants:
1  Property Search
2  Visit Booking
3  Saved Properties
4  Owner Messaging
5  Roommate Preferences
6  Compatibility Match
7  Advertisement Generator
8  Move In Assistant
9  Subscription Assistant
10 Property Comparison

STRICT RULES:
- Respond ONLY in {user_language}
- Do NOT mix languages
- Use ONLY the provided database data
- Never hallucinate or invent properties
- Voice friendly answers (no markdown, no bullet symbols)
- Keep answer under 4 lines
- Be conversational and helpful

Detected language: {user_language}
""",
                },
                {
                    "role": "user",
                    "content": f"""
User Query:
{msg}

Database Data:
{context}
""",
                },
            ],
        )

        reply = res.choices[0].message.content
        save_chat(uid, "assistant", reply)

        # =====================================
        # GENERATE VOICE
        # =====================================
        lang_code = VOICE_LANG_MAP.get(user_language, "en")
        audio_url = generate_voice(reply, lang_code)

        # =====================================
        # FINAL RESPONSE
        # =====================================
        return jsonify(
            {
                "reply": reply,
                "audio": audio_url,
                "language": user_language,
                "assistant": assistant_type,
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================
# AI CHAT WITH MCP  (upgraded with 10 assistants)
# =========================================
@app.route("/chat", methods=["POST"])
def chat():

    try:
        data = request.json
        uid = data["userId"]
        msg = data["message"]

        user_language = detect_language(msg)
        save_chat(uid, "user", msg)

        # =====================================
        # 10 ASSISTANT ROUTER
        # =====================================
        assistant_type = detect_assistant_type(msg)
        print("ASSISTANT TYPE:", assistant_type)

        # =====================================
        # BUILD CONTEXT FROM DATABASE / PINECONE
        # =====================================
        context = build_context(uid, msg, assistant_type)
        print("CONTEXT:", context)

        # =====================================
        # AI RESPONSE
        # =====================================
        res = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            temperature=0.2,
            messages=[
                {
                    "role": "system",
                    "content": f"""
You are RentIt AI assistant.

Current assistant: {assistant_type}

Supported assistants:
1  Property Search
2  Visit Booking
3  Saved Properties
4  Owner Messaging
5  Roommate Preferences
6  Compatibility Match
7  Advertisement Generator
8  Move In Assistant
9  Subscription Assistant
10 Property Comparison

IMPORTANT RULES:
- Respond ONLY in the user's language: {user_language}
- Allowed languages: English, Tamil, Kannada, Hindi, Telugu
- If user speaks in multiple languages, respond in the same multiple languages
- Use ONLY given database data
- Never hallucinate properties or information
- Keep answers short and clear
""",
                },
                {
                    "role": "user",
                    "content": f"""
User Query:
{msg}

Language:
{user_language}

Database Data:
{context}
""",
                },
            ],
        )

        reply = res.choices[0].message.content
        save_chat(uid, "assistant", reply)

        return jsonify(
            {"reply": reply, "context": context, "assistant": assistant_type}
        )

    except Exception as e:
        print("CHAT ERROR:", e)
        return jsonify({"error": str(e)}), 500


# =========================================
# GENERATE VOICE
# =========================================
def generate_voice(text, lang_code="en"):
    try:
        filename = f"voice_{uuid.uuid4()}.mp3"
        path = os.path.join("static", filename)
        os.makedirs("static", exist_ok=True)
        tts = gTTS(text=text, lang=lang_code)
        tts.save(path)
        return f"/static/{filename}"
    except Exception as e:
        print("VOICE ERROR:", e)
        return None


# =========================================
# DETECT LANGUAGE
# =========================================
def detect_language(text):
    try:
        lang = detect(text)
        if lang == "ta":
            return "TAMIL"
        elif lang == "hi":
            return "HINDI"
        elif lang == "kn":
            return "KANNADA"
        elif lang == "te":
            return "TELUGU"
        else:
            return "ENGLISH"
    except:
        return "ENGLISH"


# =========================================
# SAVE CHAT
# =========================================
def save_chat(uid, role, content):
    try:
        cursor.execute(
            """
            INSERT INTO "ChatMessage" ("userId", role, content, "createdAt")
            VALUES (%s, %s, %s, NOW())
        """,
            (uid, role, content),
        )
    except Exception as e:
        print(e)


# =========================================
# MCP CLIENT
# =========================================
def call_mcp_tool(tool, payload):
    try:
        response = requests.post(
            f"http://localhost:5000/mcp/{tool}", json=payload, timeout=20
        )
        return response.json()
    except Exception as e:
        print("MCP ERROR:", e)
        return {"matches": []}


# =========================================
# MCP TOOL — SEARCH PROPERTIES
# =========================================
@app.route("/mcp/search-properties", methods=["POST"])
def mcp_search_properties():

    print("🔥 MCP SEARCH TOOL EXECUTED")

    try:
        data = request.json
        query = data.get("query", "")

        vector = create_embedding(query)

        results = index.query(
            vector=vector, top_k=5, include_metadata=True, filter={"type": "property"}
        )

        matches = []
        for m in results.get("matches", []):
            matches.append(
                {
                    "id": m.get("id"),
                    "score": float(m.get("score", 0)),
                    "metadata": m.get("metadata", {}),
                }
            )

        return jsonify({"matches": matches})

    except Exception as e:
        print("MCP SEARCH ERROR:", e)
        return jsonify({"error": str(e), "matches": []}), 500


# =========================================
# MCP DB TOOL — GET BY CITY
# =========================================
@app.route("/mcp/get-properties-by-city", methods=["POST"])
def mcp_get_properties_by_city():

    print("🔥 MCP DB TOOL EXECUTED")

    try:
        data = request.json
        city = data.get("city")

        cursor.execute(
            """
            SELECT id, city, locality, "propertyName", "propertyType"
            FROM "Property"
            WHERE LOWER(city)=LOWER(%s)
        """,
            (city,),
        )

        rows = cursor.fetchall()

        properties = [
            {
                "propertyId": r[0],
                "city": r[1],
                "locality": r[2],
                "propertyName": r[3],
                "propertyType": r[4],
            }
            for r in rows
        ]

        return jsonify({"properties": properties})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================
# REGISTER
# =========================================
@app.route("/register", methods=["POST"])
def register():

    try:
        data = request.json

        cursor.execute('SELECT id FROM "User" WHERE mobile=%s', (data["mobile"],))
        user = cursor.fetchone()

        if user:
            return jsonify({"message": "existing user", "userId": user[0]})

        cursor.execute(
            """
            INSERT INTO "User" (mobile, name, city, "createdAt")
            VALUES (%s, %s, %s, NOW())
            RETURNING id
        """,
            (data["mobile"], data["name"], data["city"]),
        )

        uid = cursor.fetchone()[0]
        return jsonify({"message": "registered", "userId": uid})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================
# ADD PROPERTY
# =========================================
@app.route("/add-property", methods=["POST"])
def add_property():

    try:
        data = request.json

        cursor.execute(
            """
            INSERT INTO "Property"
            ("userId", city, locality, street, landmark, latitude, longitude,
             "propertyName", "propertyType", parking, "createdAt", "updatedAt")
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())
            RETURNING id
        """,
            (
                data["userId"],
                data["city"],
                data["locality"],
                data.get("street"),
                data.get("landmark"),
                data.get("latitude"),
                data.get("longitude"),
                data["propertyName"],
                data["propertyType"],
                data.get("parking"),
            ),
        )

        property_id = cursor.fetchone()[0]

        # VECTOR STORE INSERT
        vector_text = (
            f"Property Name: {data['propertyName']} "
            f"City: {data['city']} "
            f"Locality: {data['locality']} "
            f"Property Type: {data['propertyType']}"
        )
        vector = create_embedding(vector_text)

        index.upsert(
            vectors=[
                {
                    "id": str(property_id),
                    "values": vector,
                    "metadata": {
                        "type": "property",
                        "propertyId": property_id,
                        "propertyName": data["propertyName"],
                        "city": data["city"],
                        "locality": data["locality"],
                        "propertyType": data["propertyType"],
                    },
                }
            ]
        )

        return jsonify({"message": "property added", "propertyId": property_id})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================
# PROPERTY SEARCH
# =========================================
@app.route("/properties", methods=["GET"])
def properties():

    try:
        city = request.args.get("city")

        cursor.execute(
            """
            SELECT id, city, locality, "propertyName", "propertyType"
            FROM "Property"
            WHERE LOWER(city)=LOWER(%s)
        """,
            (city,),
        )

        rows = cursor.fetchall()

        return jsonify(
            [
                {
                    "propertyId": r[0],
                    "title": r[3],
                    "subtitle": f"{r[2]}, {r[1]}",
                    "city": r[1],
                    "locality": r[2],
                    "propertyType": r[4],
                    "parking": "Available",
                    "gallery": [
                        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85"
                    ],
                }
                for r in rows
            ]
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================
# SEMANTIC PROPERTY SEARCH
# =========================================
@app.route("/properties/semantic", methods=["GET"])
def semantic_properties():

    try:
        query = request.args.get("query", "")
        city = request.args.get("city", "")
        top_k = int(request.args.get("topK", 5))

        # create embedding
        vector = create_embedding(query)

        # pinecone search
        results = index.query(vector=vector, top_k=top_k, include_metadata=True)

        matches = []

        for m in results.get("matches", []):

            meta = m.get("metadata", {})

            # optional city filter
            if city and meta.get("city", "").lower() != city.lower():
                continue

            matches.append(
                {
                    "propertyId": meta.get("propertyId"),
                    "title": meta.get("propertyName"),
                    "subtitle": f"{meta.get('locality')}, {meta.get('city')}",
                    "city": meta.get("city"),
                    "locality": meta.get("locality"),
                    "propertyType": meta.get("propertyType"),
                    "parking": "Available",
                    "gallery": [
                        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85"
                    ],
                }
            )

        return jsonify(matches)

    except Exception as e:
        print("SEMANTIC SEARCH ERROR:", e)
        return jsonify({"error": str(e)}), 500


# =========================================
# LIKE PROPERTY
# =========================================
@app.route("/like", methods=["POST"])
def like():

    try:
        data = request.json

        cursor.execute(
            """
            INSERT INTO "Like" ("userId", "propertyId", "createdAt")
            VALUES (%s, %s, NOW())
            ON CONFLICT DO NOTHING
        """,
            (data["userId"], data["propertyId"]),
        )

        return jsonify({"message": "property liked"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================
# VISIT BOOKING
# =========================================
@app.route("/visit", methods=["POST"])
def visit():

    try:
        data = request.json

        cursor.execute(
            """
            INSERT INTO "Visit" ("userId", "propertyId", "visitDateTime", status, "createdAt")
            VALUES (%s, %s, %s, 'pending', NOW())
        """,
            (data["userId"], data["propertyId"], data["visitDateTime"]),
        )

        return jsonify({"message": "visit booked"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================
# MESSAGE OWNER
# =========================================
@app.route("/message", methods=["POST"])
def message_owner():

    try:
        data = request.json

        cursor.execute(
            'SELECT "userId" FROM "Property" WHERE id=%s', (data["propertyId"],)
        )
        owner = cursor.fetchone()

        if not owner:
            return jsonify({"error": "owner not found"})

        receiver_id = owner[0]

        cursor.execute(
            """
            INSERT INTO "Message" ("senderId", "receiverId", "propertyId", "message", "createdAt")
            VALUES (%s, %s, %s, %s, NOW())
        """,
            (data["senderId"], receiver_id, data["propertyId"], data["message"]),
        )

        return jsonify({"message": "message sent"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================
# ROOMMATE PREFERENCES
# =========================================
@app.route("/roommate", methods=["POST"])
def roommate():

    try:
        data = request.json

        cursor.execute(
            """
            INSERT INTO "UserPreference" ("userId", "sharingTypes", "createdAt", "updatedAt")
            VALUES (%s, %s, NOW(), NOW())
        """,
            (data["userId"], json.dumps(data["preferences"])),
        )

        return jsonify({"message": "preferences saved"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================
# FIND MATCHES
# =========================================
@app.route("/matches/<int:uid>", methods=["GET"])
def matches(uid):

    try:
        cursor.execute(
            """
            SELECT "sharingTypes"
            FROM "UserPreference"
            WHERE "userId"=%s
            ORDER BY id DESC LIMIT 1
        """,
            (uid,),
        )

        current = cursor.fetchone()
        if not current:
            return jsonify({"error": "preferences not found"})

        current_data = current[0]
        if isinstance(current_data, str):
            current_data = json.loads(current_data)
        if not isinstance(current_data, dict):
            return jsonify({"error": "invalid current user preferences format"}), 400

        cursor.execute(
            """
            SELECT u.id, u.name, u.mobile, p."sharingTypes"
            FROM "UserPreference" p
            JOIN "User" u ON u.id = p."userId"
            WHERE u.id != %s
        """,
            (uid,),
        )

        rows = cursor.fetchall()

        fields = [
            "sleepTiming",
            "foodHabit",
            "smoking",
            "drinking",
            "occupation",
            "petFriendly",
            "cleaningFrequency",
        ]

        results = []
        for row in rows:
            other_data = row[3]
            if isinstance(other_data, str):
                other_data = json.loads(other_data)
            if not isinstance(other_data, dict):
                continue
            score = sum(2 for f in fields if current_data.get(f) == other_data.get(f))
            if score >= 5:
                results.append(
                    {"userId": row[0], "name": row[1], "mobile": row[2], "score": score}
                )

        results.sort(key=lambda x: x["score"], reverse=True)
        return jsonify(results)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================
# GENERATE ADVERTISEMENT
# =========================================
@app.route("/generate-ad", methods=["POST"])
def generate_ad():

    try:
        data = request.json

        cursor.execute(
            """
            SELECT p.city, p.locality, p."propertyName", p."propertyType",
                   p.parking, u.name, u.mobile
            FROM "Property" p
            JOIN "User" u ON p."userId" = u.id
            WHERE p.id=%s
        """,
            (data["propertyId"],),
        )

        prop = cursor.fetchone()
        if not prop:
            return jsonify({"error": "No property found"}), 404

        upload = cloudinary.uploader.upload(data["imagePath"])
        image_url = upload["secure_url"]

        prompt = f"""
Create a professional real estate advertisement.

Property Name: {prop[2]}
City: {prop[0]}
Locality: {prop[1]}
Property Type: {prop[3]}
Parking: {prop[4]}

Owner Name: {prop[5]}
Contact Number: {prop[6]}

Rules:
- Professional tone
- Attractive formatting
- Dont generate email
- Mention locality
- Mention contact information clearly
- Keep advertisement clean and short
"""
        res = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            temperature=0.5,
            messages=[{"role": "user", "content": prompt}],
        )

        ad = res.choices[0].message.content

        return jsonify(
            {
                "advertisement": ad,
                "imageUrl": image_url,
                "ownerName": prop[5],
                "mobile": prop[6],
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================
# MOVE-IN ASSISTANT
# =========================================
@app.route("/move-in/<int:pid>", methods=["GET"])
def move_in(pid):

    try:
        cursor.execute(
            """
            SELECT city, locality, "propertyName", "propertyType"
            FROM "Property"
            WHERE id=%s
        """,
            (pid,),
        )

        p = cursor.fetchone()
        if not p:
            return jsonify({"error": "property not found"})

        property_type = str(p[3]).lower()

        suggestions = [
            "Deep clean before moving",
            f"Check locality {p[1]}, {p[0]}",
            "Arrange electricity & water setup",
        ]

        if "pg" in property_type:
            suggestions.append("Check WiFi and shared washroom")
        elif "1bhk" in property_type:
            suggestions.append("Use compact furniture")
        elif "2bhk" in property_type:
            suggestions.append("Plan room-wise shifting")
        elif "villa" in property_type:
            suggestions.append("Inspect parking and garden")

        return jsonify({"moveInSuggestions": suggestions})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================
# RUN
# =========================================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
