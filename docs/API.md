# API Reference

This document describes the REST endpoints exposed by the Flask/MCP backend (`combined.py`). All endpoints are under the base URL (e.g., `http://localhost:5000`).

## Conventions

- **Content-Type**: `application/json` for request and response bodies unless otherwise noted.
- **Success Response**: HTTP 200 with a JSON body; creation endpoints return 201.
- **Error Response**: HTTP 4xx or 5xx with JSON `{ "error": "<message>" }`.

## Endpoints

### Health Check

```
GET /health
```

**Response**
```json
{
  "status": "ok",
  "service": "ZuntraAI",
  "pineconeIndex": "<value from env>",
  "mcpServer": "configured"
}
```

### User Registration

```
POST /register
```

**Request**
```json
{
  "mobile": "9876543210",
  "name": "Mohana Sriram",
  "city": "Chennai"
}
```

**Response**
```json
// New user
{
  "message": "registered",
  "userId": 123
}

// Existing user
{
  "message": "existing user",
  "userId": 123
}
```

### Add Property

```
POST /add-property
```

**Request**
```json
{
  "userId": 123,
  "city": "Chennai",
  "locality": "OMR",
  "street": "100 Feet Road",
  "landmark": "Near Tidel Park",
  "latitude": 12.9416,
  "longitude": 80.2343,
  "propertyName": "Skyline Residences",
  "propertyType": "PG",
  "parking": "Available"
}
```

**Response**
```json
{
  "message": "property added",
  "propertyId": 456
}
```

### List Properties (filtered)

```
GET /properties
```

**Query Parameters**
| Name          | Type   | Description                              |
|---------------|--------|------------------------------------------|
| `city`        | string | Filter by city (case‑insensitive)        |
| `locality`    | string | Filter by locality (case‑insensitive)    |
| `propertyType`| string | Filter by property type (case‑insensitive) |
| `limit`       | int    | Max number of results (default 20)       |

**Response** – Array of property objects:
```json
[
  {
    "propertyId": 456,
    "userId": 123,
    "city": "Chennai",
    "locality": "OMR",
    "street": "100 Feet Road",
    "landmark": "Near Tidel Park",
    "latitude": 12.9416,
    "longitude": 80.2343,
    "propertyName": "Skyline Residences",
    "propertyType": "PG",
    "parking": "Available"
  }
]
```

### Semantic Property Search

```
GET /properties/semantic
```

**Query Parameters**
| Name   | Type   | Description                                   |
|--------|--------|-----------------------------------------------|
| `query`| string | Natural language search query (required)     |
| `city` | string | Optional city filter (case‑insensitive)       |
| `topK` | int    | Number of results to return (default 5)      |

**Response** – Array of property objects (same shape as `/properties`), each may include an optional `score` field reflecting similarity.

### Like a Property

```
POST /like
```

**Request**
```json
{
  "userId": 123,
  "propertyId": 456
}
```

**Response**
```json
{
  "message": "property liked"
}
```

### Book a Visit

```
POST /visit
```

**Request**
```json
{
  "userId": 123,
  "propertyId": 456,
  "visitDateTime": "2024-01-15T14:30:00Z"
}
```

**Response**
```json
{
  "message": "visit booked",
  "visitId": 789   // auto‑generated visit ID
}
```

### Send Message to Owner

```
POST /message
```

**Request**
```json
{
  "senderId": 123,
  "propertyId": 456,
  "message": "Is the property still available?"
}
```

**Response**
```json
{
  "message": "message sent"
}
```

### Save Roommate Preferences

```
POST /roommate
```

**Request**
```json
{
  "userId": 123,
  "preferences": {
    "sleepTiming": "night",
    "foodHabit": "veg",
    "smoking": "no",
    "drinking": "occasional",
    "occupation": "student",
    "petFriendly": "yes",
    "cleaningFrequency": "weekly",
    "city": "Chennai",
    "locality": "OMR"
  }
}
```

**Response**
```json
{
  "message": "preferences saved"
}
```

### Get Roommate Matches

```
GET /matches/:uid
```

**URL Parameters**
| Name | Type | Description        |
|------|------|--------------------|
| `uid`| int  | User ID            |

**Response** – Array of match objects sorted by descending score:
```json
[
  {
    "userId": 456,
    "name": "Priya Sharma",
    "mobile": "9876543211",
    "score": 12
  },
  {
    "userId": 789,
    "name": "Rahul Kumar",
    "mobile": "9876543212",
    "score": 10
  }
]
```
*Only matches with a compatibility score ≥ 5 are returned.*

### Generate Advertisement

```
POST /generate-ad
```

**Request**
```json
{
  "propertyId": 456,
  "imagePath": "/tmp/sample.jpg"
}
```

**Response**
```json
{
  "advertisement": "Spacious PG in OMR, Chennai … Contact: 9876543210",
  "imageUrl": "https://res.cloudinary.com/.../sample.jpg"
}
```

### Move‑in Suggestions

```
GET /move-in/:pid
```

**URL Parameters**
| Name | Type | Description        |
|------|------|--------------------|
| `pid`| int  | Property ID        |

**Response**
```json
{
  "moveInSuggestions": [
    "Deep clean before moving",
    "Check locality OMR, Chennai for nearby essentials",
    "Arrange electricity & water setup",
    "Check WiFi and shared washroom"
  ]
}
```

### AI Assistant (Chat)

```
POST /chat
```

**Request**
```json
{
  "userId": 123,
  "message": "Show me PG options near Tidel Park with food included",
  "city": "Chennai"
}
```

**Response**
```json
{
  "reply": "I found several PG options near Tidel Park that include food services. The top recommendations are Skyline Residences in OMR …",
  "retrievedCount": 3
}
```

### Legacy Voice Reply (app.py only)

> The `/voice-reply` endpoint exists in the original `app.py` Flask app but is **not** present in the main `combined.py` backend. It accepts the same payload as `/chat` and returns an audio URL alongside the text reply.

```
POST /voice-reply
```

**Request**
```json
{
  "userId": 123,
  "message": "Show me PG options near Tidel Park"
}
```

**Response**
```json
{
  "reply": "...",
  "audio": "/static/voice_xxxxx.mp3",
  "language": "ENGLISH",
  "assistant": "property"
}
```

## Model Context Protocol (MCP) Server

When the backend is started with `ZUNTRA_RUN_MODE=mcp`, the Flask app is replaced by an MCP server exposing the following tools (see `docs/MCP.md` for full details):

- `mcp_get_property`
- `mcp_search_properties`
- `mcp_semantic_property_search`
- `mcp_book_visit`
- `mcp_move_in_suggestions`

These tools mirror the corresponding REST endpoints but are callable via the MCP protocol (stdin/stdout or SSE) for LLM‑agent integration.

--- 
*End of document*