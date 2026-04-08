# Files Manager

A full-stack file manager with **JWT authentication**, **role-based access control** (Admin group with full access + folder-level permissions for other groups), and **object storage** for uploads (local filesystem in dev, Google Cloud Storage in prod with signed URLs).

Repository: [github.com/sergioBustos16/filesManager](https://github.com/sergioBustos16/filesManager)

## Stack

| Layer    | Technology                                          |
| -------- | --------------------------------------------------- |
| API      | [NestJS](https://nestjs.com/) 11, TypeORM, PostgreSQL 16 |
| Frontend | [Nuxt 4](https://nuxt.com/), Vue 3, Tailwind CSS    |
| Storage  | Local filesystem (dev) / GCS signed URLs (prod)     |
| Infra    | Docker Compose, Kubernetes manifests, Bitbucket CI  |
| Auth     | Passport.js, JWT (Bearer tokens)                    |

## Architecture

```
apps/
  backend/              # NestJS REST API
    src/
      common/           # Guards, decorators, shared types
      config/           # App configuration (env-validated)
      database/         # TypeORM connection config
      modules/
        auth/           # Register, login, JWT strategy
        users/          # User entity & /users/me
        groups/         # Group CRUD, user assignment (admin-only)
        folders/        # Folder CRUD, permission management
        files/          # File upload (signed URL), download, delete
        storage/        # Storage adapter (local / GCS)
      seed/             # Admin user seeder
  frontend/             # Nuxt 4 SPA
    app/
      components/       # File manager UI components
      composables/      # useAuth, useFiles, useFolders, useGroups, useToast
      layouts/          # Auth layout, dashboard layout
      middleware/        # Route auth guard
      pages/            # Login, register, folders, admin
      plugins/          # API client ($apiFetch)
infra/
  docker-compose.yml    # PostgreSQL 16 for local development
  k8s/                  # Kubernetes manifests (Deployment, Service, Ingress)
postman/                # API collection (gitignored)
```

## Features

- **Authentication**: Register/login with email + password; JWT stored as cookie (`access_token`)
- **Admin role**: Users in the `Admin` group bypass all folder permission checks and can manage groups/folders via `/admin/*`
- **Folder permissions**: Non-admin access is controlled per-folder, per-group with `canRead` / `canWrite` / `canDelete` flags
- **File uploads**: Client requests a signed upload URL, `PUT`s the file directly to storage, then registers file metadata
- **Storage backends**: Local filesystem in development, GCS with signed URLs in production
- **Upload policy**: Configurable max sizes for images (25 MB), PDFs (50 MB), and other files (100 MB); only `image/*` and `application/pdf` allowed

## Prerequisites

- **Node.js** 22+ (LTS recommended)
- **npm** (workspaces are used at the repo root)
- **Docker** (for PostgreSQL via `infra/docker-compose.yml`)

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose -f infra/docker-compose.yml up -d
```

### 2. Configure environment

**Backend** — copy and edit `apps/backend/.env.example` to `apps/backend/.env`:

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | API server port | `3005` |
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_USERNAME` | DB user | `postgres` |
| `DATABASE_PASSWORD` | DB password | `postgres` |
| `DATABASE_NAME` | DB name | `files_manager` |
| `JWT_SECRET` | Signing key (**change in production!**) | `change-me` |
| `JWT_EXPIRES_IN` | Token expiry | `1d` |
| `STORAGE_BACKEND` | `local` or `gcs` | `local` |
| `API_PUBLIC_URL` | URL the browser uses to reach the API | `http://localhost:3005` |

**Frontend** — copy `apps/frontend/.env.example` to `apps/frontend/.env`:

| Variable | Description | Default |
| --- | --- | --- |
| `NUXT_PUBLIC_API_BASE_URL` | Backend API base URL | `http://localhost:3005` |

### 3. Install dependencies

```bash
npm install
```

### 4. Seed the admin user

```bash
npm run seed:admin --workspace backend
```

Defaults: `admin@localhost.com` / `AdminPass123!` (override with `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` env vars).

### 5. Run in development

```bash
npm run dev:backend    # API on http://localhost:3005
npm run dev:frontend   # UI on http://localhost:3000
```

## NPM Scripts

| Script | Workspace | Description |
| --- | --- | --- |
| `npm run dev:backend` | root | Start NestJS in watch mode |
| `npm run dev:frontend` | root | Start Nuxt dev server |
| `npm run build:backend` | root | Production build (NestJS) |
| `npm run build:frontend` | root | Production build (Nuxt) |
| `npm run seed:admin` | backend | Create/ensure admin user |
| `npm run test` | backend | Run unit tests |
| `npm run test:e2e` | backend | Run e2e tests |
| `npm run lint` | backend | Lint with ESLint |

## API Overview

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Register a new user |
| `POST` | `/auth/login` | Public | Login and get JWT |
| `GET` | `/users/me` | JWT | Get current user info |
| `GET` | `/folders` | JWT | List accessible folders |
| `POST` | `/folders` | JWT | Create a folder |
| `GET` | `/folders/:id` | JWT | Get folder detail + permissions |
| `PUT` | `/folders/:id/permissions` | Owner/Admin | Set group permission on folder |
| `GET` | `/folders/:id/files` | Read | List files in folder |
| `POST` | `/folders/:id/files/upload-request` | Write | Get signed upload URL |
| `POST` | `/folders/:id/files` | Write | Register uploaded file metadata |
| `GET` | `/folders/:id/files/:fileId/download-request` | Read | Get signed download URL |
| `DELETE` | `/folders/:id/files/:fileId` | Delete | Delete file |
| `GET` | `/groups` | JWT | List all groups |
| `POST` | `/groups` | Admin | Create a group |
| `POST` | `/groups/:id/users` | Admin | Assign user to group |

## Deployment

### Docker

Each app has a `Dockerfile` (multi-stage build):

```bash
# Backend
docker build -f apps/backend/Dockerfile apps/backend -t filesmanager-backend

# Frontend
docker build -f apps/frontend/Dockerfile apps/frontend -t filesmanager-frontend
```

### Kubernetes

K8s manifests are in `infra/k8s/`:

```bash
# Create secrets first (see infra/k8s/backend-secrets.example.yaml)
kubectl apply -f infra/k8s/backend-secrets.yaml
kubectl apply -k infra/k8s/
```

### CI/CD (Bitbucket Pipelines)

The `bitbucket-pipelines.yml` builds and pushes Docker images on `master` and `develop` branches. Configure these repository variables:

- `DOCKER_REGISTRY` — image prefix (e.g., `gcr.io/my-project`)
- `DOCKER_USERNAME` — registry login
- `DOCKER_PASSWORD` — registry token (secured)

## Known Limitations

- Local storage upload/download endpoints are currently `@Public()` — see [IMPROVEMENTS.md](./IMPROVEMENTS.md) for details
- No pagination on list endpoints
- TypeORM `synchronize` is used instead of migrations (development only)
- File status enum only has `READY` — upload lifecycle states are not implemented yet
- No rate limiting on auth endpoints

## License

This project is licensed under the **GNU General Public License v3.0** (GPL-3.0). See the [LICENSE](./LICENSE) file.