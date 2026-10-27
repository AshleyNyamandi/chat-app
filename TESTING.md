# Functionality checks

Use Node.js 24 and npm. Install each package from its lockfile:

```sh
npm ci --prefix backend
npm ci --prefix frontend
```

Run the checks from the repository root:

```sh
npm test --prefix backend
npm test --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
npm audit --omit=dev --prefix backend
npm audit --omit=dev --prefix frontend
```

The backend suite starts an isolated, disposable MongoDB and the real HTTP/Socket.IO
server. It uses synthetic users and never needs production credentials or an existing
database. MongoDB downloads its binary on the first run, which requires network access.
On Ubuntu 26, if binary detection fails, run the backend test with
`MONGOMS_DISTRO=ubuntu-24.04` to use the compatible Ubuntu 24.04 binary.

Backend coverage includes authentication, cookies, token refresh, validation, access
control, contacts, chat partners, bidirectional history, persistence, failed uploads,
live delivery, and presence across multiple connections. Storage failure checks use
an intentionally unreachable local endpoint; they do not verify successful uploads.
Welcome email delivery is handled as a separate browser smoke check.

The frontend suite checks conversation request races, live messages during history
loading, account cleanup, pending requests after logout, send failures, chat list
updates, network errors, socket configuration, and concurrent token refresh.

## Browser smoke checklist

Use a local backend and synthetic accounts. The frontend reads `VITE_API_URL` for the
API root (default `/api/v1`) and `VITE_BASE_URL` for Socket.IO (default same origin).
A same-origin local reverse proxy must forward `/api` and `/socket.io` to the backend.
The backend requires MongoDB, signing secrets, `CLIENT_URL`, Resend configuration,
and Supabase Storage configuration, as declared in `backend/src/lib/env.js`.

- Sign up, reject invalid/duplicate details, login with wrong/correct credentials.
- Reload an authenticated page; refresh access; logout and switch accounts.
- Check empty states, contacts, conversation starters, and chat partners.
- Send/receive messages with two users; reload to verify history and privacy.
- Check online/offline changes, reconnects, and multiple tabs.
- Abort a send request and verify the draft survives and optimistic message disappears.
- Select/remove an image; reject non-images and images over 5 MB.
- Verify image messages and avatar uploads with configured Supabase buckets:
  `nymd-interview-app` (messages), `online-school-documents` (avatars).
- Verify upload failures show an error and leave the app usable.
- Toggle sounds, reload, close chats with the button and Escape, and use the 404 actions.
- Repeat at mobile (390 × 844) and desktop (1280 × 900) sizes; inspect console errors.

A local Resend emulator can capture welcome emails using the SDK's
`RESEND_BASE_URL` override. Successful Supabase uploads require a real local/test
Supabase service with those buckets; they must be reported as unverified when absent.
