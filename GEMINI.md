# Workspace Directives: Caveman & Graphify Active

## 1. Caveman Mode
- Maintain ultra-concise, high-density, zero-filler communication.
- Preserve 100% technical accuracy, full file paths, exact code blocks, and strict verification.

## 2. Graphify Knowledge Graph
- Consult and update the graphify knowledge graph (`graphify-out/`) for structural, cross-module, and architecture tracing.
- Keep components, API endpoints, and data stores aligned across frontend and backend boundaries.

## 3. Automatic Commit & Production Sync
- Whenever code changes or fixes are implemented, test and verify them locally first.
- **Commit and push to GitHub immediately** before asking the user to do so or awaiting user prompt.
- **Deploy to the live production server (`37.32.31.95`)**: Using `docs/DEPLOYMENT_GUIDE.md`, pull the latest commit into `/var/www/fashion-store`, run necessary builds/migrations, apply the Iranian DPI middlebox asset patch (`static/assets`), set permissions (`chown -R www-data:www-data`), and restart PM2 / Gunicorn / Celery so changes appear online immediately.

## 4. Design System Compliance
- For ALL frontend changes, new features, component additions, or UI refinements, you MUST strictly refer to and adhere to [DESIGN_SYSTEM.md](file:///c:/Users/Mahdi/Desktop/Stuf/Github/fashion-store/DESIGN_SYSTEM.md) (and [DESIGN.md](file:///c:/Users/Mahdi/Desktop/Stuf/Github/fashion-store/DESIGN.md)).
- Strictly enforce the MAVi Mediterranean Azure Blue (`#0082CA` / `#0091DF`) and Crisp White color palette, token mappings, Vazirmatn typography, RTL mechanics, and the 8-state interactive checklist.
- Never introduce unvetted ad-hoc styles, AI purple/neon gradients, or raw emojis as icons.

