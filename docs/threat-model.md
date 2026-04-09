# Threat Model

## Assets
- user credentials
- session state
- audit records
- admin-only views
- lockout and failure tracking state

## Actors
- guest user
- authenticated user
- admin user
- malicious actor attempting repeated authentication abuse
- malicious actor attempting unauthorized access to admin routes

## Entry points
- registration form
- login form
- forgot-password form
- logout form
- protected user routes
- admin-only routes

## Threats considered
- brute-force login attempts
- credential guessing
- repeated abuse against authentication endpoints
- unauthorized access to admin routes
- excessive information disclosure in auth responses
- weak request validation
- CSRF against state-changing routes
- poor visibility on suspicious behavior

## Mitigations
- password hashing with bcryptjs
- generic auth error messaging
- rate limiting on auth routes
- temporary account lockouts after repeated failures
- backend role enforcement for admin access
- audit logging for security-relevant events
- server-side validation on auth flows
- CSRF protection on state-changing forms

## Out of scope
- real email delivery infrastructure
- MFA
- advanced anomaly detection
- production deployment hardening
- distributed attack mitigation
