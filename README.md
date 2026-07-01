# Frontend Deployment

Deploy this folder as the Vercel project root.

`vercel.json` rewrites `/api/*` and `/uploads/*` to the ecommerce backend on Render. If your Render ecommerce backend URL differs, update the two destinations in `vercel.json`.

The delivery system remains separate. For local development, `config.js` uses `http://127.0.0.1:5050` for delivery API calls. For production, replace `https://YOUR-DELIVERY-BACKEND.onrender.com` in `config.js` with the deployed delivery backend URL.
