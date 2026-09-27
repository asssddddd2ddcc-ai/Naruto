# Naruto Railway Panel

## Deploy on Railway
1. Upload this folder/repository to GitHub.
2. Create a Railway service from the repo.
3. Railway detects `package.json` and runs `npm start`.
4. The app listens on `process.env.PORT`.
5. SQLite database is created as `naruto.db`.

## Important
This is a real deployable admin-panel starter with:
- Dashboard
- Users CRUD
- Config list/create
- Subscription endpoint `/sub/:token`
- SQLite persistence
- Responsive Naruto-style UI

The protocol/config records are management data; this starter does not control an Xray server or generate live Xray inbound configurations yet.
