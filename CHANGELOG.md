# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of the Zuntra platform (MVP).
- Backend: Flask + MCP server (`combined.py`) with:
  - User registration (`/register`).
  - Property management (`/add-property`, `/properties`, `/properties/semantic`).
  - Social interactions: likes (`/like`), visits (`/visit`), messages (`/message`).
  - Roommate matching (`/roommate`, `/matches/:uid`).
  - Assistant features: advertisement generation (`/generate-ad`),
    move‑in suggestions (`/move-in/:pid`),
    AI chat (`/chat`).
  - MCP tools exposing the same capabilities.
- Frontend: Next.js 13 app (App Router) with:
  - Landing page and user onboarding.
  - Property search & listing (semantic + filtered).
  - Roommate matching page.
  - AI chat assistant.
  - Dashboard with metrics and profile.
- Database schema (PostgreSQL) defined via Prisma (`prisma/schema.prisma`):
  - `User`, `Property` (`PGDetails`), `UserPreference`, `Like`,
    `Visit`, `Message`, `Subscription`, `Otp`, `Apartment`,
    `PropertyView`, `VisitStatus`.
- External integrations:
  - Vector embeddings via `sentence-transformers/all-MiniLM-L6-v2`.
  - Similarity search in Pinecone index `realestate`.
  - LLM inference via Groq (LLaMA 3 8B).
  - Media storage and transformations via Cloudinary.
  - Optional TTS via gTTS/ElevenLabs (present in legacy `app.py`).

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

## [0.1.0] - 2026-07-08

### Added
- Initial public release (this changelog).

[Unreleased]: https://github.com/yourusername/zuntra/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/zuntra/releases/tag/v0.1.0