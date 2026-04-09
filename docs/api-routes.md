# API and Route Map

## Public routes
- `GET /`
- `GET /register`
- `POST /register`
- `GET /login`
- `POST /login`
- `GET /forgot-password`
- `POST /forgot-password`
- `POST /logout`

## Authenticated user routes
- `GET /dashboard`
- `GET /profile`
- `GET /activity`

## Admin routes
- `GET /admin`
- `GET /admin/users`
- `GET /admin/logs`
- `GET /admin/locked-accounts`
- `POST /admin/users/:id/unlock`

## Route protection summary
- `register`, `login`, and `forgot-password` should be guest-only
- `dashboard`, `profile`, and `activity` should require authentication
- all `/admin/*` routes should require the `admin` role

## Notes
- Authentication routes should be rate-limited.
- State-changing routes should include CSRF protection.
- Admin routes should write audit entries when security-relevant actions occur.
