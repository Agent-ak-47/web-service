# Atlas Trips — Frontend

Angular 21 single-page app for the Atlas Trips travel agency: browse packages, flights and
excursions, book them, pay online, and (for admins) manage the catalogue and reservations.

## Run

```bash
npm install
npm start          # http://localhost:4200
```

Useful alongside the backend from `kamal\run.bat`, which starts this dev server too.

## Test

```bash
npm test           # Node test runner over tests/*.test.ts
```

## Mock accounts

Both demo accounts share the same password. They exist in the database seed
(`db/init/90-seed.sql`) and in the frontend mock backend (`MOCK_MODE` in
`src/services/global.service.ts`, currently `false`).

| Role   | Email                | Password     |
| ------ | -------------------- | ------------ |
| Client | client@agency.travel | Password123! |
| Admin  | admin@agency.travel  | Password123! |

Admins land on `/admin` after sign-in; clients land on the page they were browsing.

## Mock payment cards

| Card                | Expiry | CVV | Result            |
| ------------------- | ------ | --- | ----------------- |
| 4242424242424242    | 12/28  | 123 | Success           |
| 4000000000000002    | 12/28  | 123 | Declined (`402`)  |
