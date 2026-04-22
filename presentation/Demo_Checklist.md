# Demo Checklist

## Pre-demo setup

- Run `docker compose up -d --build`
- Confirm containers are healthy:
  - frontend
  - api-gateway
  - auth-service
  - core-service
  - mongo
  - keycloak
- Open frontend at `http://localhost:3000`
- Open API gateway status at `http://localhost:8080/health`

## Accounts

- JWT manager:
  - email: manager@lakeshore.local
  - password: Manager123!
- Keycloak seeded users (optional flow):
  - manager1 / Manager123!
  - tenant1 / Tenant123!
  - maintenance1 / Maint123!

## Demo flow

1. Log in as manager and show role-based dashboard controls.
2. Create a maintenance user with manager privileges.
3. Create a property.
4. Log out and register/log in as tenant.
5. Submit an application for an active property.
6. Log back in as manager and approve the application.
7. Create a lease from approved application.
8. Log in as tenant and create a maintenance request.
9. Log in as manager or maintenance and update request status.
10. Record a payment as manager and verify tenant payment visibility.
11. Demonstrate manager delete workflow on a removable resource to show full data lifecycle coverage.

## Security checkpoints to mention

- Unauthorized role actions return 403 from backend
- Invalid payloads return backend validation errors
- Protected endpoints require bearer token
- Keycloak mode validates token signatures using JWKS

## Backup plan

- Use Postman collection for direct API demo if frontend issue occurs
- Show docker logs and gateway routing to prove integration
- Presentation file is available at `presentation/LakeshoreCondoManagement_Phase3_Presentation.pptx`
