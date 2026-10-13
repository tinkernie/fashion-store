# Frontend Design Specification

> **Authoritative Specification:** [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)  
> **Brand Identity:** MAVi Mediterranean Azure & Crisp White Luxury Editorial  
> **Primary Tokens:** MAVi Azure Blue (`#0082CA` / `#0091DF`), Pure White (`#FFFFFF`), Ice Tints (`#F0F8FF` / `#E1F2FE`), Aegean Slate (`#0B192C`)  
> **Typography:** Vazirmatn (Farsi Primary) + Geist / Sans (Latin/Numerals)  
> **Dials:** `DESIGN_VARIANCE: 7` · `MOTION_INTENSITY: 6` · `VISUAL_DENSITY: 4`  

---

## 1. Core Visual Principles
- **Mediterranean Clarity:** High-end, contemporary fashion house fusing Mediterranean clarity with modern minimalist precision.
- **Locked Accent Palette:** Centered on MAVi Blue (`#0082CA` / `#0091DF`) and luminous white surfaces, avoiding pure monochrome black/white or generic palettes.
- **RTL-First Mechanics & Universal RTL Preservation:** Flawless right-to-left layout alignment with Vazirmatn Persian typography. ALWAYS preserve native RTL (`dir="rtl"`) across all components, modal dialogs, popovers, select dropdowns, and date pickers. Floating portals must explicitly declare or inherit `dir="rtl"`, and calendar grids must strictly order days from Saturday (`ش`) to Friday (`ج`).
- **Interactive Discipline:** Strict adherence to the 8-state interactive checklist (default, hover, active/pressed, focus-visible, disabled, loading, empty, error) defined in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

---

## 2. Design Decision Hierarchy
When designing or modifying UI components, follow this strict precedence:
1. Explicit requirements and visual references provided by the user.
2. Established rules and tokens in `DESIGN.md` and [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
3. Existing project-specific reusable components (`frontend/src/components`).
4. Specialized design skills (`/impeccable`, `/hallmark`, `/design-taste-frontend`, `/ui-ux-pro-max`, `/ux-ui-agent-skills`, `/high-end-visual-design`).
5. Established accessibility (WCAG 2.2 AA) and engineering standards.

---

## 3. Anti-AI-Slop Directives
All UI implementations must strictly avoid generic AI template patterns:
- **BANNED:** AI purple/violet gradients, neon glow blobs, muddy warm beige/brass clichés, and unstyled raw emojis.
- **BANNED:** Arbitrary pill wrappers on non-button elements, excessive blur/glassmorphism, and layout-shifting hovers.
- **BANNED:** Low-contrast cyan on white, illegible ghost buttons, generic cards without hierarchy.
- **BANNED:** Fake UI chrome (fake browser bars, fake traffic lights, fake mobile frames).
- **ENFORCED:** Single locked accent palette, crisp physical micro-interactions, WCAG AA contrast (>4.5:1 text, >3:1 UI components), and clean typography.
- **ENFORCED:** Human-written copy audited via `/humanizer` for all user-facing strings.

---

## 4. Responsive Quality Floors
Every UI change must render cleanly without layout breaks across:
- **Mobile (320px, 375px, 414px):** Single-column stacks, no horizontal overflow (`overflow-x: clip`), minimum 44×44px touch targets.
- **Tablet (768px):** Fluid grid transitions, readable typography scale.
- **Desktop (1024px, 1440px+):** Asymmetrical editorial bento rhythm, generous whitespace, structured MAVi containers.

---

## 5. Token & Component Implementation
For complete OKLCH semantic mappings, Tailwind utilities, and component specifications, refer directly to [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
