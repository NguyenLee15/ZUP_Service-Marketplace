# Release QA Checklist

## URLs

- BE Render: `https://service-marketplace-prod-free.onrender.com`
- Web Vercel: `https://service-marketplace-gold.vercel.app`
- Customer Android preview: https://expo.dev/accounts/lee0408/projects/homeservice-customer/builds/b9dfa167-1f90-4272-a9e5-99e018fab276
- Provider Android preview: https://expo.dev/accounts/lee0408/projects/homeservice-provider/builds/ecc63c80-9c3d-41da-807b-cbf8a01dee0c

## Test Accounts

- Admin: set in the private demo note or Render/Supabase seed output.
- Customer: create/register through web or customer app before demo.
- Provider: create/register through provider app before demo.

Do not commit real passwords, API keys, refresh tokens, or Supabase URLs with credentials.

## Automated QA Run

- Web build: clean Docker build for `fe/wed` passed before Vercel deploy.
- Web smoke: `/` and `/services` returned `200` on Vercel.
- BE smoke:
  - `/health` returned `200`.
  - `/health/ready` returned `200`.
  - `/services/search` returned `200`.
  - `/categories/tree` returned `200`.
  - invalid VNPay IPN returned `200`, not `500`.
- Customer mobile:
  - `npm run typecheck` passed.
  - `npx expo-doctor` passed.
  - Android preview build was queued on EAS.
- Provider mobile:
  - `npm run typecheck` passed.
  - `npx expo-doctor` passed.
  - Android preview build was queued on EAS.

## Audit Notes

- `fe/wed`: `npm audit --omit=dev` returned `0 vulnerabilities`.
- `fe/customer-mobile`: high severity `axios` advisory was fixed by upgrading to `axios@~1.16.1`.
- `fe/mobile`: high severity `axios` advisory was fixed by upgrading to `axios@~1.16.1`.
- Remaining mobile advisories are moderate Expo/transitive packages. `npm audit fix --force` would upgrade to Expo SDK 56, so do not force this before demo without a separate SDK upgrade batch.

## Manual Demo Flow

1. Open web home, service search, service detail, and category tree.
2. Customer login/register on web or customer app.
3. Customer opens booking detail and verifies timeline is loaded from BE.
4. Customer filters notifications, deletes one owned notification, and renames a chatbot session.
5. Provider logs in on provider app.
6. Provider opens booking detail timeline, accepts/quotes/starts/completes a booking.
7. Admin logs in on web.
8. Admin checks staff permissions, categories CRUD, audit logs list/export, and booking timeline.

## Points To Explain In Demo

- BE is a modular monolith because the project is one team, one deployable, and needs transactional consistency for booking and wallet flows.
- Provider does not have a web dashboard in this scope; provider workflows are handled by the provider mobile app.
- Web is scoped to customer and admin workflows.
- Render hosts BE, Vercel hosts web, EAS builds mobile previews.
- Supabase is used for PostgreSQL; production/test database URLs must not be mixed.
