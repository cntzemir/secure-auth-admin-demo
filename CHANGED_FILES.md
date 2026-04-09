This patch completes the remaining plan gaps and fixes the last security/presentation issues.

Changed files:
- src/services/authService.js
  - Adds explicit error codes for lockout flows so the controller can log a dedicated account lock event.
- src/controllers/authController.js
  - Logs a dedicated `account_locked` audit event when repeated failed logins trigger a temporary lock.
- src/services/auditService.js
  - Fixes CSRF audit severity classification.
  - Classifies `account_locked` as a high-severity event.
- src/controllers/adminController.js
  - Uses the security summary for dashboard monitoring data.
  - Passes enriched recent, suspicious, and high-priority events to the admin dashboard.
- src/views/admin/dashboard.ejs
  - Adds high-priority event visibility and extra monitoring summary cards.
- src/views/admin/locked-accounts.ejs
  - Adds the missing CSRF token to the unlock form.
- README.md
  - Updates the project summary to match the finished implementation exactly.
