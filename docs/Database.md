# Database Design

Zuntra uses a PostgreSQL relational database to store core entities such as users, properties, interactions, and preferences. The schema is defined in `prisma/schema.prisma` and is also reflected in the raw SQL queries used by the Flask backend (`combined.py`).

## Entity‑Relationship Diagram

```mermaid
erDiagram
    USER ||..|< APARTMENT : owns
    USER ||..|< PG_DETAILS : owns
    USER ||..|< USER_PREFERENCE : has
    USER ||..|< LIKE : gives
    USER ||..|< VISIT : makes
    USER ||..|< MESSAGE : sends
    USER ||..|< MESSAGE : receives
    USER ||..|< SUBSCRIPTION : subscribes
    USER ||..|< CHAT_MESSAGE : logs

    APARTMENT ||..|| USER : owned_by
    PG_DETAILS ||..|| USER : owned_by
    PG_DETAILS ||..|< LIKE : receives
    PG_DETAILS ||..|< MESSAGE : receives
    PG_DETAILS ||..|< VISIT : receives
    PG_DETAILS ||..|< PROPERTY_VIEW : receives

    USER_PREFERENCE ||..|| USER : belongs_to
    LIKE ||..|| USER : given_by
    LIKE ||..|| PROPERTY : on_property
    VISIT ||..|| USER : made_by
    VISIT ||..|| PROPERTY : for_property
    MESSAGE ||..|| USER : sent_by
    MESSAGE ||..|| USER : received_by
    MESSAGE ||..|| PROPERTY : related_to
    SUBSCRIPTION ||..|| USER : belongs_to
    CHAT_MESSAGE ||..|| USER : belongs_to
```

## Tables & Columns

| Table | Columns (key constraints) | Description |
|-------|---------------------------|-------------|
| **User** | `id` (PK, autoinc), `mobile` (UNIQUE), `name`, `email` (nullable), `isProfileComplete` (default false), `city`, `locality`, `latitude`, `longitude`, `createdAt` (timestamp) | Core account record; mobile acts as the primary identifier (no password). |
| **Apartment** | `id` (PK), `userId` (FK → User), `city`, `locality`, `street`, `landmark`, `latitude`, `longitude`, `propertyType2`, `buildingType`, `bhkType`, `floor`, `totalFloor`, `builtUpArea`, `propertyAge`, `facing`, `furnishing` (JSON), `otherFeatures` (JSON), `ApartmentType`, `createdAt`, `updatedAt` | Details for apartment‑type listings. |
| **PGDetails** (mapped to `"Property"` in queries) | `id` (PK), `userId` (FK), `city`, `locality`, `street`, `landmark`, `latitude`, `longitude`, `propertyName`, `propertyType`, `roomType` (JSON), `foodIncluded` (bool), `foodType` (JSON), `pgAmenities` (JSON), `parking`, `availableFrom`, `noticePeriod`, `gateClosingTime`, `images` (TEXT[]), `video` (URL), `contactName`, `mobileNo`, `whatsapp` (bool), `whatsappupdates` (bool), `preferredTenant` (JSON), `preferredGuests` (JSON), `restrictions` (JSON), `propertyDescription`, `currentStep` (int), `isDraft` (bool), `isDeleted` (bool), `createdAt`, `updatedAt` | Main table for rental properties (PG, villa, etc.). Many JSON columns store flexible attributes. |
| **UserPreference** | `id` (PK), `userId` (FK), `city`, `locality`, `search`, `pgFor`, `sharingTypes` (JSON), `preferredTenant`, `preferredGuests`, `availability`, `parking`, `foodIncluded` (bool), `rentMin`, `rentMax`, `amenities` (JSON), `nearby` (JSON), `restrictions` (JSON), `premiumSort`, `createdAt`, `updatedAt` | Stores a user’s saved search and roommate preferences. |
| **Like** | `id` (PK), `userId` (FK), `propertyId` (FK), `createdAt` (timestamp) | Many‑to‑many relationship between users and properties they liked. Unique constraint on (`userId`, `propertyId`). |
| **Visit** | `id` (PK), `userId` (FK), `propertyId` (FK), `date` (string), `time` (string), `language` (default 'en'), `visitDateTime` (timestamp), `status` (enum: pending, confirmed, calling, cancelled, completed), `isCalled` (bool), `createdAt` | Records a booked or completed property viewing. |
| **Message** | `id` (PK), `senderId` (FK), `receiverId` (FK), `propertyId` (FK), `message` (text), `createdAt` | Enables users to contact property owners (and vice‑versa). Indexes on `propertyId`, `senderId`, `receiverId`. |
| **Subscription** | `id` (PK), `userId` (FK), `planType`, `planDuration`, `amount`, `paymentId`, `propertyType`, `startDate`, `endDate`, `isActive` (default true), `createdAt` | Tracks premium plans purchased by a user. |
| **Otp** | `id` (PK), `mobile`, `otp`, `expiresAt`, `createdAt` | Simple OTP table for verification (used in legacy flow). |
| **ChatMessage** | `id` (PK), `userId` (FK), `role` ('user'|'assistant'), `content` (text), `createdAt` | Logs conversation history for each user. |

## Indexes (excerpt from schema)

- `User`: unique on `mobile`.
- `UserPreference`: index on `userId`, composite on (`userId`, `createdAt`).
- `Like`: unique on (`userId`, `propertyId`).
- `Visit`: indexes on `userId`, `propertyId`, `status`.
- `Message`: indexes on `propertyId`, `senderId`, `receiverId`.
- `PGDetails` (as `Property`): indexes on `userId` (implicit via foreign key) and others as needed.

## Relationships Summary

- A **User** can own many **Apartments** and **PGDetails** (properties).
- A **User** can have one **UserPreference** (the latest is used by the assistant).
- A **User** can **Like** many **Properties**; a **Property** can be liked by many **Users**.
- A **User** can create many **Visits** (as visitor) and receive many **Visits** (as property owner via the property foreign key).
- A **User** can send and receive many **Messages**; each **Message** is tied to a single **Property** (the subject of the conversation).
- A **User** can have at most one active **Subscription** (multiple rows allowed but only one marked `isActive` typically).
- **ChatMessage** stores the conversation history for the AI assistant.

## Notes on Implementation

- The Flask backend (`combined.py`) accesses the tables via raw SQL with `psycopg2` and `RealDictCursor`. It does **not** use an ORM; however, the column names and table names match the Prisma schema exactly.
- JSON‑typed columns (`sharingTypes`, `amenities`, `furnishing`, etc.) are stored as PostgreSQL `jsonb` (via Prisma’s `Json` type) and are read/written using `json.dumps` / `json.loads` in Python.
- Enums are represented as strings in the database (e.g., `VisitStatus` values: `pending`, `confirmed`, `calling`, `cancelled`, `completed`).
- The `Property` table in SQL queries corresponds to the `PGDetails` model; the `Apartment` model is stored in a separate table but is not directly used by the semantic search (only PGDetails are embedded into Pinecone).

--- 
*End of document*