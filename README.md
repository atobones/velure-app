# Veluré Café

Loyalty card app for Veluré Café in Warsaw. Guests install it as a PWA, staff use `/kasa` on a tablet or phone.

## Features

- Sign-in with an e-mail code or Google
- Stamp card: 9 stamps, rewards at 3, 6 and 9, birthday dessert
- QR code and card number at the till
- Gift a free coffee to a friend, invite a friend
- Missing-stamp requests with a receipt photo
- Staff app: scan, add stamps, issue rewards, undo
- Owner tools: requests, new items and sets for the Start screen, staff and PINs
- Polish and English

## Stack

Next.js 15, TypeScript, Tailwind CSS 4, SQLite (better-sqlite3), Docker, Caddy.

## Development

```bash
npm install
npm run dev
```

Local dev creates two staff accounts: Owner (PIN `1111`) and Barista (PIN `2222`). E-mail codes are printed to the console when SMTP is not set.

## Environment

| Variable | Purpose |
| --- | --- |
| `STAFF_SEED` | Initial staff, e.g. `Anna:owner:1234;Jan:barista:5678` (required in production) |
| `PUBLIC_URL` | Public address, used in gift links |
| `SMTP_USER`, `SMTP_PASS` | Gmail account for login codes |
| `CODE_PEPPER` | Secret for hashing login codes |
| `GOOGLE_CLIENT_ID` | Google sign-in |
| `VELURE_DB` | Database path (default `data/velure.db`) |
| `VELURE_DOMAIN` | Domain for Caddy (in `deploy/.env`) |

## Deploy

```bash
docker buildx build --platform linux/amd64 -t velure-app:latest --load .
```

`deploy/` has the Compose file, Caddyfile and backup script.
