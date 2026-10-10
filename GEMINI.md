# Workspace Directives: Senior Engineering, Planning & Production Delivery

## 1. Caveman & Communication Protocols
- Maintain ultra-concise, high-density, zero-filler communication (`/cavecrew` efficiency); no sugarcoating or conversational boilerplate.
- **Language Separation**: Always converse with the user in English in chat (even when addressed in Persian or other languages). Generate Persian text for the website UI when requested (Vazirmatn typography, native RTL).
- Preserve 100% technical accuracy, full file paths, exact code blocks, and strict verification.

## 2. Graph-First Architecture & Exploration
- Consult the graphify knowledge graph (`graphify-out/`) before reading source files to map dependencies, community hubs, and data flow.
- Target investigations strictly to affected modules; verify graph findings against active source lines before finalizing plans.
- Refresh graph via `graphify update .` when graph drift affects target areas.

## 3. Mandatory Planning & Approval Workflow
- **Phase 1 — Understand & Interview**: Clarify ambiguities, edge cases, and constraints with the user using `/grill-me`. Never make unverified assumptions on consequential decisions.
- **Phase 2 — Investigate**: Trace graph and source files, identify potential regressions, integration risks, and dependencies.
- **Phase 3 — Implementation Walkthrough**: Before modifying files, provide a structured plan containing:
  1. Task understanding & acceptance criteria
  2. Current-state analysis & findings
  3. Proposed solution & technical rationale
  4. Exact files to modify, create, or delete
  5. Ordered implementation steps
  6. Risk assessment & mitigation strategies
  7. Verification & testing strategy (commands, manual checks)
- **Phase 4 — Explicit Approval Gate**: **NEVER modify code, configurations, or docs before receiving explicit user approval.** Present the walkthrough as an artifact with feedback enabled so the user can review and click Proceed. Silence or ambiguity is not approval.
- **Phase 5 — Implement, Validate & Deliver**: Execute approved plan only. Test locally, verify against regressions, and follow Section 6.

## 4. Feature Preservation & Scope Integrity
- Never remove, disable, replace, or degrade existing functionality without explicit user authorization.
- Prefer targeted, backward-compatible modifications over broad rewrites.
- Preserve existing component behaviors, routes, and API contracts.

## 5. Design System Compliance & Anti-AI-Slop Standards
- Strictly adhere to [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) and [DESIGN.md](DESIGN.md): MAVi Mediterranean Azure Blue (`#0082CA` / `#0091DF`), crisp white surfaces, Vazirmatn Persian typography, RTL mechanics, and the 8-state interactive checklist.
- Ban generic AI slop: no purple/violet glows, excessive blur/glassmorphism, arbitrary pill wrappers, unstyled raw emojis, or layout-shifting hovers.
- Apply specialized design skills when relevant: `/hallmark`, `/design-taste-frontend`, `/impeccable`, `/high-end-visual-design`, `/ui-ux-pro-max`, `/ux-ui-agent-skills`.
- Ensure human-written copy via `/humanizer` for all user-facing strings (headings, labels, empty states, error messages).
- Never redesign working interfaces merely for aesthetic novelty; every UI change must have a justified functional or UX purpose.

## 6. Git Workflow, Commits & Production Sync
- **Local Verification**: Run all relevant tests, builds, and linting before staging changes.
- **Atomic Commit**: Generate Conventional Commit title with concise, informative rationale and scope.
- **Automatic Push**: After successful verification and commit on `main`, push safely to `origin/main`. Never force-push or bypass protections.
- **Detailed Commit Summary in Chat**: Always output full commit title, rationale, modified paths, and functional changes in conversation.
- **Production Deployment**: Following push, deploy to live production server (`37.32.31.95`) per `docs/DEPLOYMENT_GUIDE.md`: pull latest commit to `/var/www/fashion-store`, run migrations/builds, apply Iranian DPI middlebox patch (`static/assets`), set permissions (`chown -R www-data:www-data`), and restart PM2 / Gunicorn / Celery.
