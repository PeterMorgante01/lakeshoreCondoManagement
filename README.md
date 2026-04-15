# Lakeshore Condo Management

Secure backend for a condo and rental operations platform built for the Modern Web Technologies course project.

## Team Contributions

Project group members:

- Anmol Kashyap
- Seher Ugurlu
- Serena Nina Omondi
- Peter Morgante

Contribution tasks:

- Anmol Kashyap: Backend security implementation, JWT and Keycloak authentication flows, role-based authorization enforcement.
- Seher Ugurlu: Data modeling and schema validation design across core collections and business entities.
- Serena Nina Omondi: API testing coverage using Postman, validation scenarios, and workflow verification support.
- Peter Morgante: Business case definition, project planning, and backend foundation setup for the initial phase.

## Project Status

- Phase I: Completed
- Phase II: Completed
- Phase II+ Keycloak delegated authentication: Completed
- Phase III frontend and deployment: Not started

## Business Case

Small property managers often rely on spreadsheets, email, and ad hoc notes to track listings, tenant applications, leases, maintenance, and payments. That leads to missing records, delayed approvals, weak accountability, and inconsistent access control.

Lakeshore Condo Management centralizes those workflows in a single backend that enforces validation, role-based access control, and persistent data management at the API and database layers.

## Technology Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens
- bcryptjs
- Postman
- GitHub
- Keycloak for delegated authentication mode

## Architecture

The backend is organized into:

- `src/routes` for REST endpoint definitions
- `src/controllers` for request handling and business logic
- `src/models` for MongoDB schemas
- `src/middleware` for authentication, authorization, and centralized errors
- `src/config` for database and authentication mode configuration
- `src/utils` for reusable response, identity, and mapping helpers

## Authentication Modes

### JWT Mode

- `AUTH_MODE=jwt`
- Local users are stored in MongoDB
- Public self-registration is limited to `TENANT`
- Managers can create staff accounts securely through `POST /api/auth/users`

### Keycloak Mode

- `AUTH_MODE=keycloak`
- Authentication and authorization are delegated to Keycloak
- API access tokens are verified against Keycloak JWKS
- Local `/api/auth/register` and `/api/auth/login` endpoints are disabled
- Keycloak users are never provisioned into the `User` collection

## Business Workflows Implemented

- User authentication and protected profile access
- Manager-controlled property creation and updates
- Tenant application creation
- Manager application approval and rejection
- Lease creation from an approved application or an explicit tenant identity
- Tenant maintenance request creation
- Manager or maintenance staff request updates
- Manager payment recording
- Tenant-scoped lease and payment visibility

## Data Model

Collections:

- `users`
- `properties`
- `applications`
- `leases`
- `maintenancerequests`
- `payments`

Important design choice:

- JWT users can still be referenced by local MongoDB user ids
- Keycloak users are stored as identity snapshots on business records
- This keeps workflows functional without provisioning external users into MongoDB

## API Summary

Implemented endpoints: 22 API routes (+ 1 root status endpoint: `GET /`)

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/users`
- `GET /api/auth/me`

### Keycloak

- `GET /api/keycloak/info`
- `GET /api/keycloak/me`
- `GET /api/keycloak/verify-token`
- `POST /api/keycloak/logout`

### Properties

- `POST /api/properties`
- `GET /api/properties`
- `GET /api/properties/:id`
- `PATCH /api/properties/:id`

### Applications

- `POST /api/applications`
- `GET /api/applications`
- `PATCH /api/applications/:id/status`

### Leases

- `POST /api/leases`
- `GET /api/leases`

### Maintenance

- `POST /api/maintenance`
- `GET /api/maintenance`
- `PATCH /api/maintenance/:id/status`

### Payments

- `POST /api/payments`
- `GET /api/payments`

## Environment Setup

Create `backend/.env` from `backend/.env.example`.

### JWT Mode Example

```env
AUTH_MODE=jwt
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/lakeshoreCondoManagement
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### Keycloak Mode Example

```env
AUTH_MODE=keycloak
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/lakeshoreCondoManagement
KEYCLOAK_AUTH_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=lakeshore
KEYCLOAK_CLIENT_ID=property-rental-app
KEYCLOAK_CLIENT_SECRET=change_me
SESSION_SECRET=change_me
NODE_ENV=development
```

## Run

```bash
cd backend
npm install
npm run dev
```

## Local Keycloak Demo

This repo includes a local Keycloak setup for delegated authentication:

```bash
docker compose -f docker-compose.keycloak.yml up -d
```

Local Keycloak details:

- realm: `lakeshore`
- client: `property-rental-app`
- admin console: `http://localhost:8080/admin`
- admin login: `admin / admin`
- seeded users:
  - `manager1 / Manager123!`
  - `tenant1 / Tenant123!`
  - `maintenance1 / Maint123!`

Configure `backend/.env` with the local Keycloak values above (copy from `backend/.env.example` if needed).

## Verification Scripts

From `backend`:

```bash
npm run verify:jwt
npm run verify:keycloak-data
npm run verify:submission
```

What they cover:

- `verify:jwt` runs a full embedded-auth workflow smoke test
- `verify:keycloak-data` proves the no-provisioning Keycloak data path works
- `verify:submission` runs both checks back to back

## Postman

Import these files into Postman:

- `postman/LakeshoreCondoManagement.postman_collection.json`
- `postman/LakeshoreCondoManagement.local.postman_environment.json`

They provide ready-made requests for JWT mode and Keycloak mode endpoints.

## Submission Notes

This backend now satisfies the course Phase II backend requirements and the added delegated-authentication requirement:

- Embedded JWT authentication and authorization are implemented
- Delegated Keycloak authentication and authorization are implemented
- Keycloak mode does not provision users into MongoDB
- Role-based business workflows remain functional in both modes
- Centralized error handling and backend validation are present

## Verification Performed

Locally verified in JWT mode:

- tenant registration
- privileged self-registration rejection
- manager login
- manager-created staff account
- property creation
- application submission and approval
- lease creation from approved application
- maintenance request creation and assignment
- payment creation and tenant-scoped payment visibility

Locally verified at the data layer for Keycloak mode:

- property, application, lease, and maintenance records can be stored using external identity snapshots
- Keycloak tenant workflows do not require a MongoDB `User` document
- no Keycloak user was provisioned to the `User` collection during the check

See [KEYCLOAK.md](KEYCLOAK.md) for Keycloak setup details and [PHASE_2_PLUS_IMPLEMENTATION.md](PHASE_2_PLUS_IMPLEMENTATION.md) for the implementation summary.
