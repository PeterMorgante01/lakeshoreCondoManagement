# Lakeshore Condo Management

Lakeshore Condo Management is a full-stack web application built for the Modern Web Technologies course project. The system helps small property managers handle rental listings, tenant applications, leases, maintenance requests, and rent payments in one secure, database-driven platform.

This repository represents the complete project across all phases:

- Phase I: backend foundation, business case, initial API structure, and core models
- Phase II: MongoDB integration, authentication, authorization, and validation
- Phase III: React frontend, API gateway deployment, Docker containerization, and presentation/demo readiness

## Project Overview

Small property managers often rely on spreadsheets, email, and informal notes to run daily operations. That approach makes it difficult to enforce access control, track workflow status, and preserve accurate records across time.

Lakeshore Condo Management solves that problem with:

- a Node.js and Express.js backend
- a MongoDB database managed through Mongoose
- a React frontend dashboard
- JWT authentication and delegated Keycloak support
- role-based access control enforced at the backend
- Dockerized deployment using an API Gateway microservices pattern

## Business Case

The system is designed for a condo or rental management business that needs to:

- publish and manage rental properties
- let tenants register and submit applications
- allow managers to review applications and create leases
- let tenants submit maintenance requests for active leases
- allow managers and maintenance staff to manage maintenance status
- record rent payments and preserve historical data

The project addresses a real operational problem with persistent data, meaningful relationships, backend validation, and role-based workflows.

## User Roles

- `MANAGER`
  Privileged user who manages staff, properties, application approvals, leases, maintenance assignments, payments, and deletion actions where permitted.

- `TENANT`
  End user who can register, log in, view their own records, submit rental applications, and create maintenance requests tied to their lease.

- `MAINTENANCE`
  Staff user who can review assigned or unassigned maintenance requests and update status according to backend rules.

## Project Phases

### Phase I - Backend Foundation

- Business case definition
- Express application setup
- Initial route/controller/model structure
- Core REST API design
- GitHub repository setup

### Phase II - Database and Security Integration

#### Work Completed

- Integrated MongoDB using Mongoose
- Created schemas for users, properties, applications, leases, maintenance requests, and payments
- Added schema validation, required fields, defaults, relationships, and indexes
- Implemented JWT registration and login
- Added protected routes and backend role-based authorization
- Added centralized error handling and environment-based configuration
- Verified backend workflows with Postman and validation scenarios

#### Group Member Contributions

- Anmol Kashyap
  Implemented backend security, JWT authentication flow, protected middleware, and backend authorization rules
- Seher Ugurlu
  Designed and refined the MongoDB schema structure, validation rules, relationships, and indexing strategy
- Serena Nina Omondi
  Prepared and validated Postman request flows, tested protected endpoints, and checked invalid input and authorization scenarios
- Peter Morgante
  Supported the business case definition, planning, backend foundation continuity, and transition from Phase I into the secured database-driven backend

### Phase III - Frontend Integration and Deployment

#### Work Completed

- Built the React frontend dashboard
- Connected the frontend to backend APIs through the gateway
- Added role-aware views for manager, tenant, and maintenance users
- Added workflow forms for applications, leases, maintenance, payments, and delete operations
- Dockerized the frontend, backend services, MongoDB, Keycloak, API gateway, and optional Ollama service
- Implemented the API Gateway microservices deployment pattern with separate auth and core services
- Added delegated Keycloak support for authentication verification
- Prepared presentation assets, demo checklist, and deployment-ready documentation

#### Group Member Contributions

- Anmol Kashyap
  Extended the backend for Phase III deployment, integrated gateway-aware auth behavior, and supported delete workflow and secured service routing
- Seher Ugurlu
  Ensured Phase III business workflows remained aligned with the data model and backend business rules, including CRUD lifecycle support
- Serena Nina Omondi
  Verified frontend-backend workflow behavior, validation/error handling, and supported submission/demo readiness with testing and checklist updates
- Peter Morgante
  Supported deployment documentation, presentation structure, demo flow preparation, and overall Phase III project packaging

## Technology Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- React with Vite
- JSON Web Tokens
- Keycloak
- Nginx
- Docker Compose
- Postman
- GitHub

## Architecture

The project is deployed using an API Gateway microservices design pattern.

### Containers

1. `frontend`
   React application served by Nginx
2. `api-gateway`
   Nginx reverse proxy that routes requests to backend services
3. `auth-service`
   Backend service responsible for `/api/auth` and `/api/keycloak`
4. `core-service`
   Backend service responsible for business APIs
5. `mongo`
   Persistent MongoDB database
6. `keycloak`
   Delegated authentication provider
7. `ollama`
   Optional profile for future AI-related extensions

### Backend Service Modes

The backend codebase is shared, and service behavior is selected through `SERVICE_ROLE`.

- `SERVICE_ROLE=auth`
  Enables `/api/auth` and `/api/keycloak`
- `SERVICE_ROLE=core`
  Enables `/api/properties`, `/api/applications`, `/api/leases`, `/api/maintenance`, and `/api/payments`
- `SERVICE_ROLE=monolith`
  Enables all routes in a single service

## Features

### Authentication and Authorization

- Tenant self-registration in JWT mode
- Secure login with JWT
- Password hashing with `bcryptjs`
- Protected profile retrieval
- Role-based backend authorization
- Keycloak token validation in delegated mode

### Data Management

- Create, read, update, and delete operations across business resources
- Backend validation rules for payloads and business workflows
- Structured error responses
- Persistent storage in MongoDB

### Frontend

- React dashboard for all supported roles
- Role-aware interface for manager, tenant, and maintenance users
- Validation feedback and backend error display
- Responsive layout for desktop and mobile
- Frontend communicates only with backend APIs through the gateway

## Business Workflows

### User Authentication Workflow

- Tenant account creation
- Secure login
- Access to protected endpoints with bearer tokens
- Profile retrieval through `/api/auth/me`

### Role-Based Workflow

- Manager-only actions for user creation, property management, lease creation, payment recording, and delete operations
- Tenant-only actions for application submission and maintenance creation
- Maintenance-only or manager-authorized maintenance status updates
- Unauthorized access rejected by backend middleware

### Data Lifecycle Workflow

- Properties can be created, listed, updated, and deleted when business rules allow it
- Applications can be submitted, reviewed, approved or rejected, and deleted
- Leases can be created from approved applications and deleted
- Maintenance requests can be created, updated, assigned, and deleted
- Payments can be recorded, listed, and deleted

## Database Design

The project uses at least 6 MongoDB collections:

- `users`
- `properties`
- `applications`
- `leases`
- `maintenancerequests`
- `payments`

The schemas include:

- required fields
- validation rules
- default values
- relationships using references and identity snapshots
- indexes for common queries

## API Summary

The backend exceeds the minimum required endpoint count and includes multiple protected endpoints.

### Auth and Identity

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/users`
- `GET /api/auth/me`
- `GET /api/keycloak/info`
- `GET /api/keycloak/me`
- `GET /api/keycloak/verify-token`
- `POST /api/keycloak/logout`

### Core Business APIs

- `POST /api/properties`
- `GET /api/properties`
- `GET /api/properties/:id`
- `PATCH /api/properties/:id`
- `DELETE /api/properties/:id`
- `POST /api/applications`
- `GET /api/applications`
- `PATCH /api/applications/:id/status`
- `DELETE /api/applications/:id`
- `POST /api/leases`
- `GET /api/leases`
- `DELETE /api/leases/:id`
- `POST /api/maintenance`
- `GET /api/maintenance`
- `PATCH /api/maintenance/:id/status`
- `DELETE /api/maintenance/:id`
- `POST /api/payments`
- `GET /api/payments`
- `DELETE /api/payments/:id`

## Repository Structure

```text
backend/        Express app, controllers, models, middleware, scripts
frontend/       React app and frontend Nginx config
infra/          API gateway and Keycloak infrastructure assets
postman/        API collection and environment files
presentation/   Presentation outline, checklist, and deck
```

## Environment Configuration

Root environment example:

- [`.env.example`](</c:/Users/silya/OneDrive/Desktop/New folder/Phase 3/lakeshoreCondoManagement/.env.example>)

Main variables include:

- `AUTH_MODE`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `SESSION_SECRET`
- `BOOTSTRAP_MANAGER_NAME`
- `BOOTSTRAP_MANAGER_EMAIL`
- `BOOTSTRAP_MANAGER_PASSWORD`
- `KEYCLOAK_REALM`
- `KEYCLOAK_CLIENT_ID`
- `KEYCLOAK_CLIENT_SECRET`
- `KEYCLOAK_BEARER_ONLY`
- `KEYCLOAK_PUBLIC_CLIENT`
- `KEYCLOAK_ADMIN_USER`
- `KEYCLOAK_ADMIN_PASSWORD`
- `FRONTEND_URL`

## Running the Project

### Recommended: Docker Deployment

From the repository root:

```bash
docker compose up -d --build
```

Main URLs:

- Frontend: `http://localhost:3000`
- API Gateway: `http://localhost:8080`
- API Gateway health: `http://localhost:8080/health`
- Keycloak Admin: `http://localhost:8081/admin`
- MongoDB: `mongodb://localhost:27017`

Optional Ollama profile:

```bash
docker compose --profile ollama up -d
```

### Local Development Without Docker

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api` to `http://localhost:8080`.

## Demo Accounts

### JWT Mode

On startup, a manager account is bootstrapped if it does not already exist:

- email: `manager@lakeshore.local`
- password: `Manager123!`

### Keycloak Seeded Users

The local Keycloak realm import is stored in:

- `infra/keycloak/realm-import/lakeshore-realm.json`

Seeded users:

- `manager1 / Manager123!`
- `tenant1 / Tenant123!`
- `maintenance1 / Maint123!`

## Validation and Testing

Postman assets:

- `postman/LakeshoreCondoManagement.postman_collection.json`
- `postman/LakeshoreCondoManagement.local.postman_environment.json`

The project is designed to demonstrate:

- protected endpoint enforcement
- authorization failures for invalid roles
- invalid payload handling
- persistent MongoDB data storage
- stable deployment through Docker and Nginx gateway routing

## Presentation Assets

Presentation materials are included in:

- [Phase3_Presentation_Deck_Outline.md](</c:/Users/silya/OneDrive/Desktop/New folder/Phase 3/lakeshoreCondoManagement/presentation/Phase3_Presentation_Deck_Outline.md>)
- [Demo_Checklist.md](</c:/Users/silya/OneDrive/Desktop/New folder/Phase 3/lakeshoreCondoManagement/presentation/Demo_Checklist.md>)
- [LakeshoreCondoManagement_Phase3_Presentation.pptx](</c:/Users/silya/OneDrive/Desktop/New folder/Phase 3/lakeshoreCondoManagement/presentation/LakeshoreCondoManagement_Phase3_Presentation.pptx>)

## Team Contributions

Project group members:

- Anmol Kashyap
- Seher Ugurlu
- Serena Nina Omondi
- Peter Morgante

Phase-specific contributions are documented in the `Phase II` and `Phase III` sections above so the README reflects what each member contributed during each stage of the project.

## Additional Notes

- Keycloak delegated mode is supported without provisioning external users into MongoDB
- Backend authorization is enforced server-side, not only in the frontend
- The gateway dynamically routes traffic to the auth and core services
- The repository contains the full project, not only the final frontend/deployment phase
