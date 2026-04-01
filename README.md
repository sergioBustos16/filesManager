# Files Manager

A full-stack file manager with **JWT authentication**, **role-based access** (including an Admin group with full access to all folders), **folder-level permissions** for other groups, and **object storage** for uploads. In development, files are stored on disk; in production you can use **Google Cloud Storage** (GCS) with signed URLs.

Repository: [github.com/sergioBustos16/filesManager](https://github.com/sergioBustos16/filesManager)

## Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| API      | [NestJS](https://nestjs.com/), TypeORM, PostgreSQL |
| Frontend | [Nuxt 4](https://nuxt.com/), Vue 3, Tailwind CSS   |
| Storage  | Local filesystem (dev) or GCS (signed URLs)       |
| Infra    | Docker Compose for PostgreSQL                     |

## Repository layout

```
apps/
  backend/     # NestJS REST API (auth, users, groups, folders, files)
  frontend/    # Nuxt SPA (dashboard, folders, uploads, admin screens)
infra/
  docker-compose.yml   # Postgres 16 for local development
```

This repo intentionally **does not** commit `node_modules`, lockfiles (see below), `.cursor`, local `.env` files, or the `postman/` folder. Copy `.env.example` files into `.env` and configure secrets locally.

## Prerequisites

- **Node.js** (LTS recommended)
- **npm** (workspaces are used at the repo root)
- **Docker** (optional, for Postgres via `infra/docker-compose.yml`)

## Quick start

1. **Start PostgreSQL** (from repo root):

   ```bash
   docker compose -f infra/docker-compose.yml up -d
   ```

2. **Environment**

   - `apps/backend/.env` — copy from `apps/backend/.env.example` and adjust `DATABASE_*`, `JWT_SECRET`, `PORT`, `API_PUBLIC_URL` (must match how the browser reaches the API, e.g. `http://localhost:3005` in dev), and storage settings.
   - `apps/frontend/.env` — copy from `apps/frontend/.env.example` if present; `nuxt.config.ts` uses `public.apiBaseUrl` for the API.

3. **Install dependencies** (lockfiles are not committed; npm will resolve dependencies on install):

   ```bash
   npm install
   ```

4. **Seed the admin user** (optional defaults are documented in `apps/backend/.env.example`):

   ```bash
   npm run seed:admin --workspace backend
   ```

5. **Run in development**

   ```bash
   npm run dev:backend    # API (default port from .env, often 3005)
   npm run dev:frontend   # UI (default http://localhost:3000)
   ```

## NPM scripts (root)

| Script            | Description        |
| ----------------- | ------------------ |
| `npm run dev:backend`  | NestJS watch mode |
| `npm run dev:frontend` | Nuxt dev server   |
| `npm run build:backend` | Production build |
| `npm run build:frontend` | Nuxt build       |

## Features (high level)

- Register / login; JWT stored in an HTTP-only-friendly cookie flow via the client (`access_token` cookie).
- **Admin** users bypass folder permission rows and can read/write/delete everywhere; the UI does not list Admin in folder permission pickers.
- Non-admin access is driven by **folder permissions** (read / write / delete) per group.
- Uploads: request a signed upload URL, `PUT` the file, then register the file metadata (images/PDFs per server policy).

## License

This project is licensed under the **GNU General Public License v3.0** (GPL-3.0). See the `LICENSE` file in the repository.
