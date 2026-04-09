# Testing Checklist

## Basic setup
- [ ] `npm install` completes successfully
- [ ] `.env` is created from `.env.example`
- [ ] `npm run seed` creates the default admin user
- [ ] `npm start` launches the app locally

## Registration and login
- [ ] registration works with valid input
- [ ] registration rejects invalid input
- [ ] duplicate email registration is rejected
- [ ] login works with correct credentials
- [ ] login failure shows a generic error message
- [ ] logout works correctly

## Role protection
- [ ] signed-out users cannot access `/dashboard`
- [ ] normal users cannot access `/admin`
- [ ] admin users can access all admin views

## Abuse handling
- [ ] repeated failed login attempts increase the failure count
- [ ] lockout triggers after the expected number of failures
- [ ] locked users cannot log in until the lock expires or an admin unlocks them
- [ ] admin unlock action resets the lock state correctly

## Audit visibility
- [ ] registration creates an audit entry
- [ ] login success creates an audit entry
- [ ] login failure creates an audit entry
- [ ] logout creates an audit entry
- [ ] admin actions create audit entries
- [ ] suspicious or denied behavior is visible in admin logs

## Form protection
- [ ] state-changing forms include CSRF tokens
- [ ] invalid or missing CSRF tokens are rejected safely
- [ ] authentication forms are validated on the server
