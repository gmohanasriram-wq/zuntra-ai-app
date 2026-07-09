import os
import json
from contextlib import contextmanager
from functools import lru_cache
from typing import Optional, List, Dict, Any

import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from groq import Groq
import cloudinary
import cloudinary.uploader
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from fastmcp import FastMCP

load_dotenv()

app = Flask(__name__)
mcp = FastMCP(
    "ZuntraAI",
    mask_error_details=True,
    on_duplicate="error",
)

# =========================================================
# ENV / CONFIG
# =========================================================
def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def configure_cloudinary() -> None:
    cloudinary.config(
        cloud_name=require_env("CLOUDINARY_CLOUD_NAME"),
        api_key=require_env("CLOUDINARY_API_KEY"),
        api_secret=require_env("CLOUDINARY_API_SECRET"),
    )


configure_cloudinary()


# =========================================================
# SINGLETON SERVICES
# =========================================================
@lru_cache(maxsize=1)
def get_groq_client() -> Groq:
    return Groq(api_key=require_env("GROQ_API_KEY"))


@lru_cache(maxsize=1)
def get_pinecone_index():
    pc = Pinecone(api_key=require_env("PINECONE_API_KEY"))
    # If your SDK version expects a host instead of a name, store the host in PINECONE_INDEX.
    return pc.Index(require_env("PINECONE_INDEX"))


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    return SentenceTransformer("all-MiniLM-L6-v2")


# =========================================================
# DATABASE
# =========================================================
@contextmanager
def db_cursor(commit: bool = False):
    conn = psycopg2.connect(require_env("DATABASE_URL"), sslmode="require")
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        yield cur
        if commit:
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


# =========================================================
# COMMON HELPERS
# =========================================================
def ok(data: Any, status: int = 200):
    return jsonify(data), status


def bad_request(message: str):
    return jsonify({"error": message}), 400


def property_to_dict(row: Dict[str, Any], score: Optional[float] = None) -> Dict[str, Any]:
    data = {
        "propertyId": row["id"],
        "userId": row.get("userId"),
        "city": row.get("city"),
        "locality": row.get("locality"),
        "street": row.get("street"),
        "landmark": row.get("landmark"),
        "latitude": row.get("latitude"),
        "longitude": row.get("longitude"),
        "propertyName": row.get("propertyName"),
        "propertyType": row.get("propertyType"),
        "parking": row.get("parking"),
    }
    if score is not None:
        data["score"] = score
    return data


def fetch_property_by_id(property_id: int) -> Optional[Dict[str, Any]]:
    with db_cursor() as cur:
        cur.execute(
            """
            SELECT
                id,
                "userId",
                city,
                locality,
                street,
                landmark,
                latitude,
                longitude,
                "propertyName",
                "propertyType",
                parking
            FROM "Property"
            WHERE id = %s
            """,
            (property_id,),
        )
        return cur.fetchone()


def build_property_document(prop: Dict[str, Any]) -> str:
    return "\n".join(
        [
            f"Property ID: {prop['id']}",
            f"City: {prop.get('city') or ''}",
            f"Locality: {prop.get('locality') or ''}",
            f"Street: {prop.get('street') or ''}",
            f"Landmark: {prop.get('landmark') or ''}",
            f"Property Name: {prop.get('propertyName') or ''}",
            f"Property Type: {prop.get('propertyType') or ''}",
            f"Parking: {prop.get('parking') or ''}",
        ]
    )


def embed_text(text: str) -> List[float]:
    vector = get_embedding_model().encode(text)
    return vector.tolist()


def upsert_property_vector(property_id: int) -> None:
    prop = fetch_property_by_id(property_id)
    if not prop:
        return

    vector = embed_text(build_property_document(prop))
    metadata = {
        "propertyId": str(prop["id"]),
        "city": (prop.get("city") or "").lower(),
        "locality": (prop.get("locality") or "").lower(),
        "propertyType": (prop.get("propertyType") or "").lower(),
        "propertyName": prop.get("propertyName") or "",
    }

    get_pinecone_index().upsert(
        vectors=[
            (
                str(prop["id"]),
                vector,
                metadata,
            )
        ]
    )


def semantic_property_search(query: str, city: Optional[str] = None, top_k: int = 5) -> List[Dict[str, Any]]:
    filters = {"city": {"$eq": city.lower()}} if city else None

    result = get_pinecone_index().query(
        vector=embed_text(query),
        top_k=top_k,
        include_metadata=True,
        filter=filters,
    )

    raw_matches = result.get("matches", []) if isinstance(result, dict) else getattr(result, "matches", [])
    ids: List[int] = []
    scores: Dict[int, float] = {}

    for match in raw_matches:
        match_id = int(match["id"] if isinstance(match, dict) else match.id)
        match_score = float(match.get("score", 0) if isinstance(match, dict) else getattr(match, "score", 0))
        ids.append(match_id)
        scores[match_id] = match_score

    if not ids:
        return []

    with db_cursor() as cur:
        cur.execute(
            """
            SELECT
                id,
                "userId",
                city,
                locality,
                street,
                landmark,
                latitude,
                longitude,
                "propertyName",
                "propertyType",
                parking
            FROM "Property"
            WHERE id = ANY(%s)
            """,
            (ids,),
        )
        rows = cur.fetchall()

    rows_by_id = {row["id"]: row for row in rows}
    ordered = []

    for pid in ids:
        row = rows_by_id.get(pid)
        if row:
            ordered.append(property_to_dict(row, score=scores.get(pid)))

    return ordered


def save_chat(user_id: int, role: str, content: str) -> None:
    with db_cursor(commit=True) as cur:
        cur.execute(
            """
            INSERT INTO "ChatMessage" ("userId", role, content, "createdAt")
            VALUES (%s, %s, %s, NOW())
            """,
            (user_id, role, content),
        )


def compare_preferences(current_data: Dict[str, Any], other_data: Dict[str, Any]) -> int:
    score = 0
    keys = [
        "sleepTiming",
        "foodHabit",
        "smoking",
        "drinking",
        "occupation",
        "petFriendly",
        "cleaningFrequency",
    ]
    for key in keys:
        if current_data.get(key) == other_data.get(key):
            score += 2
    return score


def generate_move_in_suggestions_for_property(prop: Dict[str, Any]) -> List[str]:
    property_type = str(prop.get("propertyType", "")).lower()
    suggestions = [
        "Deep clean before moving",
        f"Check locality {prop.get('locality', '')}, {prop.get('city', '')}",
    ]

    if "pg" in property_type:
        suggestions.append("Check WiFi and shared washroom")
    elif "1bhk" in property_type:
        suggestions.append("Use compact furniture")
    elif "2bhk" in property_type:
        suggestions.append("Plan room-wise shifting")
    elif "villa" in property_type:
        suggestions.append("Inspect parking and garden")

    return suggestions


# =========================================================
# FLASK ROUTES
# =========================================================
@app.route("/health", methods=["GET"])
def health():
    return ok(
        {
            "status": "ok",
            "service": "ZuntraAI",
            "pineconeIndex": os.getenv("PINECONE_INDEX"),
            "mcpServer": "configured",
        }
    )


@app.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json(silent=True) or {}
        mobile = data.get("mobile")
        name = data.get("name")
        city = data.get("city")

        if not mobile or not name or not city:
            return bad_request("mobile, name, and city are required")

        with db_cursor(commit=True) as cur:
            cur.execute('SELECT id FROM "User" WHERE mobile = %s', (mobile,))
            existing = cur.fetchone()

            if existing:
                return ok({"message": "existing user", "userId": existing["id"]})

            cur.execute(
                """
                INSERT INTO "User" (mobile, name, city, "createdAt")
                VALUES (%s, %s, %s, NOW())
                RETURNING id
                """,
                (mobile, name, city),
            )
            row = cur.fetchone()

        return ok({"message": "registered", "userId": row["id"]}, 201)
    except Exception as e:
        return ok({"error": str(e)}, 500)


@app.route("/add-property", methods=["POST"])
def add_property():
    try:
        data = request.get_json(silent=True) or {}
        required = ["userId", "city", "locality", "propertyName", "propertyType"]
        missing = [key for key in required if not data.get(key)]
        if missing:
            return bad_request(f"Missing required fields: {', '.join(missing)}")

        with db_cursor(commit=True) as cur:
            cur.execute(
                """
                INSERT INTO "Property"
                (
                    "userId",
                    city,
                    locality,
                    street,
                    landmark,
                    latitude,
                    longitude,
                    "propertyName",
                    "propertyType",
                    parking,
                    "createdAt",
                    "updatedAt"
                )
                VALUES
                (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    NOW(), NOW()
                )
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
            row = cur.fetchone()

        property_id = row["id"]
        upsert_property_vector(property_id)

        return ok({"message": "property added", "propertyId": property_id}, 201)
    except Exception as e:
        return ok({"error": str(e)}, 500)


@app.route("/properties", methods=["GET"])
def properties():
    try:
        city = request.args.get("city")
        locality = request.args.get("locality")
        property_type = request.args.get("propertyType")
        limit = int(request.args.get("limit", 20))

        conditions = []
        params = []

        if city:
            conditions.append("LOWER(city) = LOWER(%s)")
            params.append(city)
        if locality:
            conditions.append("LOWER(locality) = LOWER(%s)")
            params.append(locality)
        if property_type:
            conditions.append('LOWER("propertyType") = LOWER(%s)')
            params.append(property_type)

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        with db_cursor() as cur:
            cur.execute(
                f"""
                SELECT
                    id,
                    "userId",
                    city,
                    locality,
                    street,
                    landmark,
                    latitude,
                    longitude,
                    "propertyName",
                    "propertyType",
                    parking
                FROM "Property"
                {where_clause}
                ORDER BY id DESC
                LIMIT %s
                """,
                (*params, limit),
            )
            rows = cur.fetchall()

        return ok([property_to_dict(row) for row in rows])
    except Exception as e:
        return ok({"error": str(e)}, 500)


@app.route("/properties/semantic", methods=["GET"])
def properties_semantic():
    try:
        query = request.args.get("query")
        city = request.args.get("city")
        top_k = int(request.args.get("topK", 5))

        if not query:
            return bad_request("query is required")

        results = semantic_property_search(query=query, city=city, top_k=top_k)
        return ok(results)
    except Exception as e:
        return ok({"error": str(e)}, 500)


@app.route("/like", methods=["POST"])
def like_property():
    try:
        data = request.get_json(silent=True) or {}
        user_id = data.get("userId")
        property_id = data.get("propertyId")

        if not user_id or not property_id:
            return bad_request("userId and propertyId are required")

        with db_cursor(commit=True) as cur:
            cur.execute(
                """
                INSERT INTO "Like" ("userId", "propertyId", "createdAt")
                VALUES (%s, %s, NOW())
                ON CONFLICT DO NOTHING
                """,
                (user_id, property_id),
            )

        return ok({"message": "property liked"})
    except Exception as e:
        return ok({"error": str(e)}, 500)


@app.route("/visit", methods=["POST"])
def visit():
    try:
        data = request.get_json(silent=True) or {}
        user_id = data.get("userId")
        property_id = data.get("propertyId")
        visit_dt = data.get("visitDateTime")

        if not user_id or not property_id or not visit_dt:
            return bad_request("userId, propertyId, and visitDateTime are required")

        with db_cursor(commit=True) as cur:
            cur.execute(
                """
                INSERT INTO "Visit" ("userId", "propertyId", "visitDateTime", status, "createdAt")
                VALUES (%s, %s, %s, 'pending', NOW())
                """,
                (user_id, property_id, visit_dt),
            )

        return ok({"message": "visit booked"}, 201)
    except Exception as e:
        return ok({"error": str(e)}, 500)


@app.route("/message", methods=["POST"])
def message_owner():
    try:
        data = request.get_json(silent=True) or {}
        sender_id = data.get("senderId")
        property_id = data.get("propertyId")
        message = data.get("message")

        if not sender_id or not property_id or not message:
            return bad_request("senderId, propertyId, and message are required")

        with db_cursor(commit=True) as cur:
            cur.execute(
                'SELECT "userId" FROM "Property" WHERE id = %s',
                (property_id,),
            )
            owner = cur.fetchone()

            if not owner:
                return ok({"error": "owner not found"}, 404)

            cur.execute(
                """
                INSERT INTO "Message"
                ("senderId", "receiverId", "propertyId", "message", "createdAt")
                VALUES (%s, %s, %s, %s, NOW())
                """,
                (sender_id, owner["userId"], property_id, message),
            )

        return ok({"message": "message sent"}, 201)
    except Exception as e:
        return ok({"error": str(e)}, 500)


@app.route("/roommate", methods=["POST"])
def roommate():
    try:
        data = request.get_json(silent=True) or {}
        user_id = data.get("userId")
        preferences = data.get("preferences")

        if not user_id or preferences is None:
            return bad_request("userId and preferences are required")

        with db_cursor(commit=True) as cur:
            cur.execute(
                """
                INSERT INTO "UserPreference"
                ("userId", "sharingTypes", "createdAt", "updatedAt")
                VALUES (%s, %s, NOW(), NOW())
                """,
                (user_id, json.dumps(preferences)),
            )

        return ok({"message": "preferences saved"}, 201)
    except Exception as e:
        return ok({"error": str(e)}, 500)


@app.route("/matches/<int:uid>", methods=["GET"])
def matches(uid: int):
    try:
        with db_cursor() as cur:
            cur.execute(
                """
                SELECT "sharingTypes"
                FROM "UserPreference"
                WHERE "userId" = %s
                ORDER BY id DESC
                LIMIT 1
                """,
                (uid,),
            )
            current = cur.fetchone()

            if not current:
                return ok({"error": "preferences not found"}, 404)

            current_data = current["sharingTypes"]
            if isinstance(current_data, str):
                current_data = json.loads(current_data)
            if isinstance(current_data, list):
                current_data = current_data[0]
            if not isinstance(current_data, dict):
                current_data = {}

            cur.execute(
                """
                SELECT
                    u.id,
                    u.name,
                    u.mobile,
                    p."sharingTypes"
                FROM "UserPreference" p
                JOIN "User" u ON u.id = p."userId"
                WHERE u.id != %s
                """,
                (uid,),
            )
            rows = cur.fetchall()

        results = []
        for row in rows:
            other_data = row["sharingTypes"]

            if isinstance(other_data, str):
                other_data = json.loads(other_data)
            if isinstance(other_data, list):
                other_data = other_data[0]
            if not isinstance(other_data, dict):
                continue

            score = compare_preferences(current_data, other_data)
            if score >= 5:
                results.append(
                    {
                        "userId": row["id"],
                        "name": row["name"],
                        "mobile": row["mobile"],
                        "score": score,
                    }
                )

        results.sort(key=lambda x: x["score"], reverse=True)
        return ok(results)
    except Exception as e:
        return ok({"error": str(e)}, 500)


@app.route("/generate-ad", methods=["POST"])
def generate_ad():
    try:
        data = request.get_json(silent=True) or {}
        property_id = data.get("propertyId")
        image_path = data.get("imagePath")

        if not property_id or not image_path:
            return bad_request("propertyId and imagePath are required")

        prop = fetch_property_by_id(property_id)
        if not prop:
            return ok({"error": "property not found"}, 404)

        upload = cloudinary.uploader.upload(image_path)
        image_url = upload["secure_url"]

        prompt = f"""
Create a professional real estate advertisement.

Property Name: {prop.get("propertyName")}
City: {prop.get("city")}
Locality: {prop.get("locality")}
Property Type: {prop.get("propertyType")}
Parking: {prop.get("parking")}

Rules:
- Professional tone
- Short advertisement
- Mention locality
- Do not invent amenities
"""

        res = get_groq_client().chat.completions.create(
            model="llama-3.1-8b-instant",
            temperature=0.4,
            messages=[{"role": "user", "content": prompt}],
        )

        ad = res.choices[0].message.content

        return ok(
            {
                "advertisement": ad,
                "imageUrl": image_url,
            }
        )
    except Exception as e:
        return ok({"error": str(e)}, 500)


@app.route("/move-in/<int:pid>", methods=["GET"])
def move_in(pid: int):
    try:
        prop = fetch_property_by_id(pid)
        if not prop:
            return ok({"error": "property not found"}, 404)

        suggestions = generate_move_in_suggestions_for_property(prop)
        return ok({"moveInSuggestions": suggestions})
    except Exception as e:
        return ok({"error": str(e)}, 500)


@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(silent=True) or {}
        user_id = data.get("userId")
        message = data.get("message")
        city = data.get("city")

        if not user_id or not message:
            return bad_request("userId and message are required")

        save_chat(user_id, "user", message)

        retrieved = semantic_property_search(query=message, city=city, top_k=5)

        if not retrieved and city:
            with db_cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        id,
                        "userId",
                        city,
                        locality,
                        street,
                        landmark,
                        latitude,
                        longitude,
                        "propertyName",
                        "propertyType",
                        parking
                    FROM "Property"
                    WHERE LOWER(city) = LOWER(%s)
                    ORDER BY id DESC
                    LIMIT 5
                    """,
                    (city,),
                )
                fallback_rows = cur.fetchall()
                retrieved = [property_to_dict(row) for row in fallback_rows]

        context = json.dumps(retrieved, ensure_ascii=False, indent=2)

        res = get_groq_client().chat.completions.create(
            model="llama-3.1-8b-instant",
            temperature=0.2,
            messages=[
                {
                    "role": "system",
                    "content": """
You are Zuntra's real-estate assistant.

Rules:
- Use only the provided property context
- If data is missing, say it is not available
- Keep the answer concise
- Never hallucinate prices, amenities, or owner details
""".strip(),
                },
                {
                    "role": "user",
                    "content": f"User query: {message}\n\nProperty context:\n{context}",
                },
            ],
        )

        reply = res.choices[0].message.content
        save_chat(user_id, "assistant", reply)

        return ok({"reply": reply, "retrievedCount": len(retrieved)})
    except Exception as e:
        return ok({"error": str(e)}, 500)


# =========================================================
# MCP TOOLS
# =========================================================
@mcp.tool(
    annotations={
        "title": "Get Property",
        "readOnlyHint": True,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def mcp_get_property(property_id: int) -> Dict[str, Any]:
    """Return a single property by its numeric id."""
    prop = fetch_property_by_id(property_id)
    if not prop:
        return {"error": "property not found"}
    return property_to_dict(prop)


@mcp.tool(
    annotations={
        "title": "Search Properties",
        "readOnlyHint": True,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def mcp_search_properties(
    city: str,
    locality: Optional[str] = None,
    property_type: Optional[str] = None,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """Search properties using structured SQL filters."""
    conditions = ["LOWER(city) = LOWER(%s)"]
    params: List[Any] = [city]

    if locality:
        conditions.append("LOWER(locality) = LOWER(%s)")
        params.append(locality)

    if property_type:
        conditions.append('LOWER("propertyType") = LOWER(%s)')
        params.append(property_type)

    with db_cursor() as cur:
        cur.execute(
            f"""
            SELECT
                id,
                "userId",
                city,
                locality,
                street,
                landmark,
                latitude,
                longitude,
                "propertyName",
                "propertyType",
                parking
            FROM "Property"
            WHERE {' AND '.join(conditions)}
            ORDER BY id DESC
            LIMIT %s
            """,
            (*params, limit),
        )
        rows = cur.fetchall()

    return [property_to_dict(row) for row in rows]


@mcp.tool(
    annotations={
        "title": "Semantic Property Search",
        "readOnlyHint": True,
        "idempotentHint": True,
        "openWorldHint": True,
    }
)
def mcp_semantic_property_search(
    query: str,
    city: Optional[str] = None,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """Search properties semantically using embeddings stored in Pinecone."""
    return semantic_property_search(query=query, city=city, top_k=top_k)


@mcp.tool(
    annotations={
        "title": "Book Visit",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": False,
    }
)
def mcp_book_visit(user_id: int, property_id: int, visit_datetime: str) -> Dict[str, Any]:
    """Create a pending visit booking for a property."""
    with db_cursor(commit=True) as cur:
        cur.execute(
            """
            INSERT INTO "Visit" ("userId", "propertyId", "visitDateTime", status, "createdAt")
            VALUES (%s, %s, %s, 'pending', NOW())
            RETURNING id
            """,
            (user_id, property_id, visit_datetime),
        )
        row = cur.fetchone()

    return {
        "message": "visit booked",
        "visitId": row["id"],
        "propertyId": property_id,
        "userId": user_id,
    }


@mcp.tool(
    annotations={
        "title": "Move In Suggestions",
        "readOnlyHint": True,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def mcp_move_in_suggestions(property_id: int) -> Dict[str, Any]:
    """Generate move-in suggestions from a property type and locality."""
    prop = fetch_property_by_id(property_id)
    if not prop:
        return {"error": "property not found"}
    return {"moveInSuggestions": generate_move_in_suggestions_for_property(prop)}


# =========================================================
# ENTRYPOINT
# =========================================================
if __name__ == "__main__":
    mode = os.getenv("ZUNTRA_RUN_MODE", "flask").lower()

    if mode == "mcp":
        mcp.run()
    else:
        app.run(
            host="0.0.0.0",
            port=int(os.getenv("PORT", 5000)),
            debug=os.getenv("FLASK_DEBUG", "false").lower() == "true",
            use_reloader=False,
        )