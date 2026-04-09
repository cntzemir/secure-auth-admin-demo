# Architecture

## High-level structure
The application follows a simple MVC-style structure:
- **routes** define access boundaries
- **controllers** coordinate request handling
- **services** contain reusable business logic and storage interactions
- **middleware** applies auth, role, rate-limit, validation, and CSRF behavior
- **views** render user and admin pages

## Request flow
1. Express receives the request.
2. Security middleware is applied.
3. Session middleware restores or initializes session state.
4. `attachLocals` exposes current user and flash state to the views.
5. Route middleware checks whether the request is guest-only, authenticated, or admin-only.
6. Controllers call services.
7. Security-relevant actions write audit log entries.
8. The response is rendered or redirected.

## Authentication flow
### Register
1. Validate request data.
2. Enforce password rules.
3. Check uniqueness of the email.
4. Hash the password.
5. Create the user.
6. Write an audit event.

### Login
1. Validate request data.
2. Apply route rate limiting.
3. Check whether the account is currently locked.
4. Compare the submitted password against the stored hash.
5. On success, create the session and reset failure counters.
6. On failure, increment failure counters and possibly trigger a temporary lock.
7. Write an audit event for both success and failure.

### Logout
1. Destroy the active session.
2. Write an audit event.

## Authorization model
- `guestOnly` protects register, login, and forgot-password pages from already-authenticated users.
- `authRequired` protects signed-in user routes.
- `requireRole('admin')` protects admin-only routes.

This means admin access is enforced on the backend, not only hidden in navigation.

## Audit model
Audit logs are used to preserve traceability for security-relevant behavior, including:
- register
- login success
- login failure
- logout
- forgot-password request
- admin actions
- unauthorized access attempts
- account lock and unlock events

## Storage model
The current package uses a portable file-backed JSON store to keep local setup simple.

The service layer is intentionally separated so the persistence layer can later be replaced with SQLite or PostgreSQL without rewriting route and controller behavior.
