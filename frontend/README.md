# Zuntra Frontend

A premium Next.js 15 frontend starter for your AI-powered real estate and roommate matching platform.

## Stack
- Next.js 15 + App Router
- TypeScript
- Tailwind CSS
- ShadCN-style UI primitives
- Framer Motion
- Axios API layer
- React Query for loading states and optimistic UX
- Sonner toasts
- next-themes for dark/light mode

## Pages included
- `/` Landing page with onboarding, AI search shell, stats, testimonials
- `/properties` Listing page with semantic search, voice UI, advanced filters, property cards
- `/properties/[id]` Detail page with gallery, visit scheduling, move-in suggestions, owner messaging, similar properties
- `/assistant` Dedicated AI chat page
- `/roommates` Compatibility matching page
- `/dashboard` Premium overview dashboard

## Backend mapping
- `POST /register` → onboarding form
- `GET /properties` → list/grid + similar properties + detail lookup fallback
- `GET /properties/semantic` → AI search results
- `POST /chat` → AI assistant
- `POST /visit` → visit scheduling
- `POST /like` → optimistic shortlist action
- `GET /matches/:uid` → roommate page
- `GET /move-in/:pid` → property detail recommendations
- `POST /message` → owner messaging

## Important backend-aware note
Your Flask API does not currently expose an HTTP `GET /properties/:id` endpoint. In this frontend, the detail page resolves a single property by loading `GET /properties` and finding the matching `propertyId` client-side.

## Run
```bash
npm install
cp .env.example .env.local
npm run dev
```
