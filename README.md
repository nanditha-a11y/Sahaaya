
# SAHAAYA — Digital Child Welfare Platform (Prototype)

Empowering Every Child Through Care, Education and Opportunity

This repository is a UI prototype for `SAHAAYA` — a digital child welfare and orphanage management platform built with React, TypeScript, Tailwind CSS, Framer Motion and Recharts.

Quick start:

```bash
npm install --prefix frontend
npm run dev --prefix frontend
```

Frontend requirements: Node.js 20.19+ or 22.12+.

Backend setup:

```bash
npm install --prefix backend
npm run dev --prefix backend
```

The API listens on port `5000` and provides:
- `GET /api/dashboard/stats`
- `GET` and `POST /api/children`
- `GET /api/resources/:id`
- `GET` and `POST /api/messages`

Pages included:
- Landing
- Dashboard
- Child management

Notes:
- This is a frontend prototype using mock JSON data under `frontend/src/data`.
- The Express backend is isolated under `backend/`.
- Run `npm run db:migrate --prefix backend` to initialize its SQLite database.
- Run `npm run db:seed --prefix backend` to seed SQLite with the existing child, donor, resource, and message data.
