# Keycloak Integration Guide

This project supports a strict delegated authentication mode using Keycloak.

## Local Setup Included In This Repo

This repository now includes a ready-to-run local Keycloak setup:

- [docker-compose.keycloak.yml](</c:/Users/silya/OneDrive/Desktop/New folder/fhfdj/lakeshoreCondoManagement/docker-compose.keycloak.yml>)
- [infra/keycloak/realm-import/lakeshore-realm.json](</c:/Users/silya/OneDrive/Desktop/New folder/fhfdj/lakeshoreCondoManagement/infra/keycloak/realm-import/lakeshore-realm.json>)

It seeds:

- realm: `lakeshore`
- client: `property-rental-app`
- roles: `tenant`, `manager`, `maintenance`
- users:
  - `manager1 / Manager123!`
  - `tenant1 / Tenant123!`
  - `maintenance1 / Maint123!`
- admin console:
  - `admin / admin`

## What Keycloak Mode Means Here

When `AUTH_MODE=keycloak`:

- login is handled by Keycloak, not this backend
- access tokens are verified with Keycloak signing keys
- application roles are derived from Keycloak realm roles
- `/api/auth/register` and `/api/auth/login` are disabled
- users are not created in the MongoDB `User` collection

The backend stores only identity snapshots on business records when it needs to associate a property, application, lease, or maintenance request with a Keycloak user.

## Required Environment Variables

```env
AUTH_MODE=keycloak
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/lakeshoreCondoManagement
KEYCLOAK_AUTH_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=property-rental
KEYCLOAK_CLIENT_ID=property-rental-app
KEYCLOAK_CLIENT_SECRET=change_me
SESSION_SECRET=change_me
NODE_ENV=development
```

For the local seeded setup created in this repo, use:

```env
AUTH_MODE=keycloak
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/lakeshoreCondoManagement
KEYCLOAK_AUTH_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=lakeshore
KEYCLOAK_CLIENT_ID=property-rental-app
KEYCLOAK_CLIENT_SECRET=lakeshore-keycloak-secret-2026
SESSION_SECRET=lakeshore-session-secret-2026
NODE_ENV=development
```

Notes:

- `KEYCLOAK_AUTH_SERVER_URL` should be the Keycloak base URL without the realm path
- `SESSION_SECRET` is required because the backend enables session middleware in Keycloak mode
- `JWT_SECRET` is not used when `AUTH_MODE=keycloak`

## Keycloak Realm Setup

Create a confidential or public OpenID Connect client and define these realm roles:

- `tenant`
- `manager`
- `maintenance`

Those roles map to application roles as follows:

- `tenant` -> `TENANT`
- `manager` -> `MANAGER`
- `maintenance` -> `MAINTENANCE`

Tokens without one of those roles are rejected.

## Start Local Keycloak

From the repository root:

```bash
docker compose -f docker-compose.keycloak.yml up -d
```

Check that it is ready:

```bash
curl http://localhost:8080/realms/lakeshore/.well-known/openid-configuration
```

## Token Verification

The backend verifies Keycloak access tokens by:

1. decoding the token header to read the signing key id
2. fetching the realm JWKS from Keycloak
3. selecting the matching certificate
4. verifying the token signature and issuer
5. ensuring the token audience or authorized party matches the configured client

This is implemented in `backend/src/middleware/keycloak.middleware.js`.

## No-Provisioning Guarantee

Keycloak users are never inserted into the local `User` collection.

Instead, business records store identity snapshots such as:

```json
{
  "subject": "6f4c1c0f-7e5b-4b4c-bfed-2e59d6a0d7cb",
  "authSource": "keycloak",
  "email": "tenant@example.com",
  "fullName": "Tenant Example",
  "role": "TENANT"
}
```

That allows the system to:

- keep a clean separation between external identity management and local business data
- support Keycloak users across workflows
- avoid provisioning or syncing external users into MongoDB

## Business Workflow Notes in Keycloak Mode

- Tenants can create applications directly using their Keycloak token
- Managers can approve those applications
- Managers can create a lease from an approved application without a MongoDB `User` document
- Maintenance assignment can target either a local JWT-mode maintenance user or an external Keycloak identity snapshot

## Useful Endpoints

- `GET /api/keycloak/info`
- `GET /api/keycloak/me`
- `GET /api/keycloak/verify-token`
- `POST /api/keycloak/logout`

Protected business endpoints such as `/api/properties`, `/api/applications`, `/api/leases`, `/api/maintenance`, and `/api/payments` also work in Keycloak mode as long as the caller presents a valid Keycloak access token with a mapped realm role.

## Get A Token Locally

From `backend`:

```bash
node scripts/get-keycloak-token.js manager1 Manager123!
```

Or use the direct token endpoint:

```bash
curl -X POST http://localhost:8080/realms/lakeshore/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=property-rental-app" \
  -d "client_secret=lakeshore-keycloak-secret-2026" \
  -d "username=manager1" \
  -d "password=Manager123!" \
  -d "grant_type=password"
```
