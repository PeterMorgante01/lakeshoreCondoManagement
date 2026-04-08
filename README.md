# Lakeshore Condo Management

Full-stack project for managing residential rental operations with secure role-based access control.

## Team

- Anmol Kashyap
- Seher Ugurlu
- Serena Nina Omondi
- Peter Morgante

## Project Overview

Small property management companies often track tenant applications, leases, payments, and maintenance requests in spreadsheets and email threads. This leads to missing records, delayed actions, and weak accountability.

Lakeshore Condo Management solves this with a secure web platform that centralizes rental workflows and enforces business rules at the backend.

## Business Case

### Problem
- Fragmented communication and manual recordkeeping.
- No reliable approval workflow.
- Poor visibility into payment and maintenance status.

### Solution
- Tenants can apply for properties and submit maintenance requests.
- Managers can approve/reject applications, create leases, and record payments.
- Maintenance staff can update and track maintenance ticket status.
- Role-based authorization ensures users can only perform permitted actions.

## Current Project Status

| Phase | Status | Notes |
|---|---|---|
| Phase 1 - Backend Foundation | Completed | Architecture, routing, initial models, repo setup |
| Phase 2 - Database + Security Integration | Completed | MongoDB integration, JWT auth, role-based access, backend validation |
| Phase 3 - Frontend + Deployment | Not started | Planned for next stage |

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (jsonwebtoken)
- bcryptjs
- dotenv
- morgan
- cors

### Tooling
- Postman (API testing)
- GitHub (version control)

## Architecture

The backend follows a layered structure:

- `routes` for endpoint definitions
- `controllers` for request handling and business logic
- `models` for MongoDB schemas and relationships
- `middleware` for authentication, authorization, not-found, and centralized errors
- `config` for database connection and environment setup

## Core Features Implemented (Phase 1 + Phase 2)

### Authentication and Authorization
- User registration with password hashing
- Login with JWT token issuance
- Protected profile endpoint (`/api/auth/me`)
- Role-based route protection (TENANT, MANAGER, MAINTENANCE)

### Data Workflows
- Property listing and manager-controlled property management
- Tenant application creation and manager status updates
- Lease creation by managers and role-scoped lease viewing
- Tenant maintenance request submission and authorized status updates
- Payment recording by managers and scoped payment visibility

### Security and Validation
- Passwords hashed using bcryptjs
- JWT verification middleware for protected APIs
- Backend business-rule enforcement and ownership checks
- Centralized error handling with validation and duplicate-key mapping
- Required environment variables for secure startup

### Database Design
- 6 MongoDB collections:
	- User
	- Property
	- Application
	- Lease
	- MaintenanceRequest
	- Payment
- Schema validation and default values
- Inter-collection references via ObjectId
- Indexes added for key query paths

## API Summary

Implemented REST endpoints: 17 total

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (protected)

### Properties
- `POST /api/properties` (manager only)
- `GET /api/properties`
- `GET /api/properties/:id`
- `PATCH /api/properties/:id` (manager only)

### Applications
- `POST /api/applications` (tenant only)
- `GET /api/applications` (protected)
- `PATCH /api/applications/:id/status` (manager only)

### Leases
- `POST /api/leases` (manager only)
- `GET /api/leases` (protected)

### Maintenance
- `POST /api/maintenance` (tenant only)
- `GET /api/maintenance` (protected)
- `PATCH /api/maintenance/:id/status` (manager or maintenance only)

### Payments
- `POST /api/payments` (manager only)
- `GET /api/payments` (protected)

## Getting Started (Backend)

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
Create `.env` in `backend` using `.env.example`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_secret
JWT_EXPIRES_IN=7d
```

### 3. Run the server
```bash
npm run dev
```

Server starts at `http://localhost:5000`.

## Member Contributions (Phase 1 and Phase 2)

### Anmol Kashyap
- Designed and implemented core data models and schema relationships for properties, applications, leases, maintenance, and payments.
- Added schema-level validation rules and indexing strategy for query performance.
- Supported backend business-rule validation for data lifecycle operations.

### Seher Ugurlu
- Structured backend project architecture and route organization (routes, controllers, models, middleware).
- Implemented and refined centralized error handling and API response patterns.
- Helped define endpoint behavior and integration flow for Phase 1 foundation and Phase 2 updates.

### Serena Nina Omondi
- Developed authentication and authorization flow using JWT, including secure access to protected resources.
- Implemented role-based route protection and unauthorized-action rejection logic.
- Strengthened security-focused backend validation and protected-route behavior.

### Peter Morgante
- Led business-case definition and requirement mapping from project specification to implementation.
- Coordinated workflow coverage across application, lease, maintenance, and payment modules.
- Managed repository progress and phase alignment to ensure completion through Phase 2.

## Next Milestone

Phase 3 will add:
- React frontend integration
- End-to-end frontend-backend connectivity
- Deployment and production configuration