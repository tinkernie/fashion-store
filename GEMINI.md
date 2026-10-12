# Workspace Directives: Operational Runtime Protocol

## 1. Operating Authority & Instruction Hierarchy
This file defines the agent runtime protocol for `fashion-store`. The authoritative references are:
- **[AGENTS.md](AGENTS.md)**: Master engineering directives, 10-phase task lifecycle, scope preservation, verification standards, and Git/production deployment rules.
- **[DESIGN.md](DESIGN.md)** & **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)**: Visual identity, MAVi Mediterranean Azure Blue tokens, typography, component standards, and anti-AI-slop rules.

All agent operations MUST strictly comply with [AGENTS.md](AGENTS.md). Avoid creating competing or conflicting instructions.

## 2. Mandatory Communication Protocols
- **English-Only Chat**: Always converse with the user in English in chat, regardless of the language used in prompts. Generate Persian text for the website UI when requested (Vazirmatn typography, native RTL).
- **Caveman Conciseness**: Maintain ultra-concise, high-density, zero-filler communication (`/cavecrew` efficiency).
- **Absolute Technical Honesty**: Never report any test, build, commit, push, or deployment as successful without direct command verification. Clearly distinguish confirmed facts from assumptions.

## 3. Operational Task Execution Protocol
Execute every incoming task strictly following the 10-phase lifecycle in [AGENTS.md](AGENTS.md):
1. **Understand**: Clarify the core objective, affected modules, and constraints.
2. **Interview (`/grill-me`)**: Interview the user on meaningful ambiguities, edge cases, and architectural choices. Skip redundant questions when requirements are clear.
3. **Investigate**: Consult documentation first, then inspect `graphify-out/` before source files. Verify findings against active code. Run `graphify update .` when graph drift occurs.
4. **Walkthrough (MANDATORY)**: Create a task walkthrough artifact containing the 15 mandatory sections defined in [AGENTS.md Section 3](AGENTS.md#3-mandatory-10-phase-task-lifecycle).
5. **Approval Gate (MANDATORY)**: Set `RequestFeedback: true` on the walkthrough artifact and **STOP**. Do not modify application source files or configurations until the user explicitly selects Proceed or grants written approval.
6. **Implement**: Apply the minimal, backward-compatible set of changes strictly adhering to the approved plan.
7. **Verify**: Execute automated tests, type-checks, linters, API contracts, console/network audit, and a11y tests. Fix task-related failures.
8. **Final Review**: Evaluate the final diff against the 10 pre-commit gates in [AGENTS.md Section 3](AGENTS.md#3-mandatory-10-phase-task-lifecycle).
9. **Commit & Push**: Create an atomic Conventional Commit with a 4-part description (What, Why, Details, Verification), commit directly to `main`, and push safely to `origin/main`.
10. **Production Deployment & Report**: Deploy to `37.32.31.95` per `docs/DEPLOYMENT_GUIDE.md` when applicable, and output the structured 8-field completion report.

## 4. Skill Dispatch Matrix
| Task Domain | Primary Skill | Trigger Condition |
| :--- | :--- | :--- |
| Codebase architecture & dependencies | `graphify` | First step of every task; consult `graphify-out/` |
| Requirement clarification | `grill-me` | Ambiguous requirements, edge cases, competing technical options |
| User-facing frontend copy | `humanizer` | Any visible UI text (headings, buttons, alerts, error messages) |
| Interface design & visual polish | `impeccable`, `hallmark`, `taste` (`design-taste-frontend`) | Creating or refining UI components, page layouts, visual styling |
| Design systems, responsive & a11y | `ui-ux-pro-max`, `ux-ui-agent-skills`, `high-end-visual-design` | Component architectures, WCAG AA audits, touch targets, mobile layouts |
| Terse output & token efficiency | `caveman`, `cavecrew` | Continuous chat communication |
