# Security Decisions

## Session-based authentication
This project uses server-side sessions rather than JWT.

For a local educational demo, this keeps the architecture easier to reason about and makes logout/session invalidation straightforward.

## Password hashing
Passwords are hashed with bcryptjs and are never stored in plain text.

The application treats password storage as one-way only and never logs raw password values.

## Generic authentication errors
Login and forgot-password responses avoid revealing whether a specific email exists.

This reduces the risk of credential enumeration.

## Rate limiting and lockouts
Authentication routes are rate-limited, and repeated failures can create a temporary lockout.

This does not eliminate brute-force risk entirely, but it meaningfully raises the cost of repeated low-effort attacks.

## Backend-enforced authorization
Admin pages are protected on the server using role middleware.

This prevents users from gaining access merely by guessing routes or manipulating the browser UI.

## Audit logging
Security-relevant actions are logged for traceability.

The design goal is visibility without over-logging secrets. Passwords, session secrets, and raw sensitive values are not written to logs.

## CSRF protection
State-changing form submissions should include anti-CSRF protection.

This is especially important in session-based applications, where authenticated browsers automatically send cookies.

## Server-side validation
Client-side validation improves UX, but it is not trusted for security.

Authentication-related requests must be validated on the server before processing.

## Portable data store
For easy local setup, this package uses a file-backed store.

This is a convenience decision, not a production recommendation. The structure intentionally allows upgrading the storage layer later.
