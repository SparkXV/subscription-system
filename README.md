# Subscription Management API

Subscription management system built with NestJS, Stripe, and MongoDB.

## Tech Stack

- NestJS, MongoDB + Mongoose, Stripe, Passport + JWT

## Prerequisites

- Node.js >= 18
- MongoDB ([install](https://www.mongodb.com/docs/manual/installation/))
- Stripe account in test mode
- [Stripe CLI](https://docs.stripe.com/stripe-cli)

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env` — you'll need your Stripe keys and price IDs (see below).

### MongoDB

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

Check it's running:

```bash
mongosh --eval "db.runCommand({ping:1})"
# should print { ok: 1 }
```

Default URI is `mongodb://localhost:27017/subscription-api` (already in `.env.example`).

### Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → make sure you're in **Test Mode**
2. Go to **API keys** → copy `sk_test_...` into `STRIPE_SECRET_KEY`
3. Create 3 products with monthly recurring prices (Basic $10, Standard $20, Premium $50)
4. Copy each price ID (`price_...`) into `STRIPE_BASIC_PRICE_ID`, `STRIPE_STANDARD_PRICE_ID`, `STRIPE_PREMIUM_PRICE_ID`

### Webhook (required)

In a separate terminal:

```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3000/webhook
```

This prints a `whsec_...` secret — copy it into `STRIPE_WEBHOOK_SECRET` in `.env`.

> Keep `stripe listen` running while testing. The secret changes every time you restart it, so update `.env` and restart the server if needed.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string (default: `mongodb://localhost:27017/subscription-api`) |
| `JWT_SECRET` | Any random string for signing tokens |
| `JWT_EXPIRATION` | Token expiry, e.g. `7d` |
| `STRIPE_SECRET_KEY` | `sk_test_...` from Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from `stripe listen` output |
| `STRIPE_BASIC_PRICE_ID` | Price ID for Basic plan |
| `STRIPE_STANDARD_PRICE_ID` | Price ID for Standard plan |
| `STRIPE_PREMIUM_PRICE_ID` | Price ID for Premium plan |
| `CLIENT_URL` | Redirect URL after checkout (default: `http://localhost:3000`) |
| `PORT` | Server port (default: `3000`) |

### Run

```bash
npm run start:dev
```

Server starts at `http://localhost:3000`. Swagger docs at `/api/docs`.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | - | Register |
| POST | `/auth/login` | - | Login, returns JWT |
| GET | `/plans` | - | List plans |
| POST | `/subscriptions/checkout` | JWT | Create Stripe checkout session |
| GET | `/subscriptions` | JWT | Get current subscription |
| POST | `/subscriptions/cancel` | JWT | Cancel subscription |
| POST | `/webhook` | Stripe signature | Stripe webhook handler |

## Testing the Flow

Make sure the server and `stripe listen` are both running.

```bash
# Sign up
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name": "QA User", "email": "qa@example.com", "password": "password123"}'

# Save the access_token from response, use it below as <token>

# Login (if you need a fresh token later)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "qa@example.com", "password": "password123"}'

# List plans
curl http://localhost:3000/plans

# Start checkout
curl -X POST http://localhost:3000/subscriptions/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"planId": "basic"}'

# Open the checkoutUrl in browser → pay with test card 4242 4242 4242 4242
# (any future expiry, any CVC, any zip)
# You'll land on /success which is a 404 — that's fine, there's no frontend.
# The webhook fires in the background and creates the subscription.

# Check subscription
curl http://localhost:3000/subscriptions \
  -H "Authorization: Bearer <token>"

# Cancel
curl -X POST http://localhost:3000/subscriptions/cancel \
  -H "Authorization: Bearer <token>"
```

**Test cards:** `4242 4242 4242 4242` (success), `4000 0025 0000 3155` (3D Secure), `4000 0000 0000 0002` (declined)

## Postman

Import `postman/Subscription_API.postman_collection.json` into Postman. It auto-saves the JWT token from signup/login so authenticated requests just work.

## Tests

```bash
npm test          # unit tests
npm run test:e2e  # integration tests
npm run test:cov  # coverage
```

## Project Structure

```
src/
├── auth/           # signup, login, JWT, guards, RBAC
├── users/          # user schema + repository
├── plans/          # hardcoded plan definitions
├── subscriptions/  # checkout, subscription CRUD
├── stripe/         # Stripe SDK + webhook handler
└── common/         # global exception filter
```

## License

MIT
