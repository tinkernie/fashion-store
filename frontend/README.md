# LUXE Fashion Store - Frontend

A luxury Iranian fashion e-commerce storefront built with Next.js (App Router), Tailwind CSS, Framer Motion, and Zustand.

---

## 🚀 Running the Project Standalone (No Backend Required)

The frontend is configured with an isolated **Standalone Mock API Layer** so you can develop and test 100% of the features (browsing, filtering, cart operations, coupons, checkout, auth, profile, and admin backoffice) without running Django or Redis.

### 1. Install dependencies & run dev server
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Switching Between Mock & Real Backend

In `.env.local`:
```env
# Set to 'false' when connecting to a real running Django backend
NEXT_PUBLIC_ENABLE_MOCKS=true

# Live Django Backend URL
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## 🗑️ How to Completely Delete the Mock Layer Later

When your backend is ready and you want to clean up mock files:
1. **Delete 2 files**:
   - `frontend/src/lib/mock-data.ts`
   - `frontend/src/lib/mock-server.ts`
2. **Remove the import line** in [`frontend/src/lib/api.ts`](./src/lib/api.ts):
   ```typescript
   // Remove this line:
   setupMockServer(api);
   ```
3. Done!
