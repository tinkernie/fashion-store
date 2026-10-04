# MAVi Fashion Store — Frontend Design System & UI Specification

> **Status:** Production Standard · Locked & Authoritative  
> **Aesthetic Family:** Mediterranean Azure & Crisp White Luxury Editorial  
> **Primary Identity:** Mavi Signature Azure (`#0082CA` / `#0091DF`), Ice-Tint Surfaces, Crisp Whites, Deep Slate Contrast  
> **Typography:** Vazirmatn (Farsi Primary) + Geist / Sans (Latin/Numerals)  
> **Dials:** `DESIGN_VARIANCE: 7` · `MOTION_INTENSITY: 6` · `VISUAL_DENSITY: 4`  
> **Mandatory Rule:** All agents, engineers, and contributors MUST reference and strictly follow this document for every UI change, component creation, or style overhaul.

---

## 1. Design Read & Core Philosophy

- **Brand Essence:** High-end, contemporary fashion house fusing Mediterranean clarity with modern minimalist precision.
- **Color Core:** A disciplined harmony of **Mavi Azure Blue**, **Pure Snow White**, and **Ice Blue tints**, grounded by deep Aegean navy/slate for text contrast.
- **Anti-Slop Stance:**
  - BANNED: Generic AI purple gradients, neon glow blobs, muddy warm beige/brass clichés, and unstyled raw emojis.
  - REJECTED: Low-contrast cyan on white, illegible ghost buttons, generic cards without hierarchy, and layout-shifting hovers.
  - ENFORCED: Single locked accent palette, crisp physical micro-interactions, WCAG AA/AAA compliance, and flawless RTL alignment.

---

## 2. Color System & Overhaul (The Mavi Blue Spectrum)

The entire UI is built on a custom calibrated spectrum of **Mavi Blue (`#0082CA`)** and **Luminous White**, moving away from pure monochrome black/white.

### 2.1 The Palette Matrix

| Token Name | Hex Code | OKLCH Equivalent | Role & Application |
| :--- | :--- | :--- | :--- |
| `mavi-50` (Ice) | `#F0F8FF` | `oklch(0.97 0.025 242)` | Subtle container backgrounds, badges, hover fills |
| `mavi-100` (Mist) | `#E1F2FE` | `oklch(0.94 0.045 242)` | Secondary pill buttons, active card borders, tint scrims |
| `mavi-200` (Sky) | `#BAE3FD` | `oklch(0.88 0.080 242)` | Glassmorphism borders, interactive highlight rings |
| `mavi-300` | `#7CCCFB` | `oklch(0.79 0.125 242)` | Secondary accents, status indicators, badges |
| `mavi-400` | `#38B3F7` | `oklch(0.70 0.165 242)` | Dark mode accent highlights, hover glows |
| `mavi-500` (Primary) | `#0091DF` | `oklch(0.62 0.185 242)` | Vibrant Mavi Brand Color, active states, key badges |
| `mavi-600` (Logo Blue) | `#0082CA` | `oklch(0.58 0.182 242)` | **Brand Anchor Color** (from logo), primary CTAs, links |
| `mavi-700` (Deep Azure) | `#006CA8` | `oklch(0.51 0.168 242)` | Primary CTA hover state, pressed states |
| `mavi-800` (Aegean) | `#005788` | `oklch(0.44 0.145 242)` | Dark text accents, strong borders on light surfaces |
| `mavi-900` (Navy Accent) | `#004870` | `oklch(0.37 0.120 242)` | Subtitle text on light blue backgrounds |
| `mavi-950` (Midnight Navy) | `#002742` | `oklch(0.24 0.085 242)` | Dark mode elevated card background, deep headers |

### 2.2 Neutral & Surface Spectrum

| Token Name | Hex Code | OKLCH Equivalent | Role & Application |
| :--- | :--- | :--- | :--- |
| `white-pure` | `#FFFFFF` | `oklch(1.0 0 0)` | Primary light card backgrounds, crisp white text, CTA labels |
| `white-cloud` | `#FAFCFE` | `oklch(0.99 0.005 242)` | Light mode page canvas background |
| `slate-aegean` | `#0B192C` | `oklch(0.18 0.045 245)` | Primary body & heading text in Light Mode (contrast ratio > 12:1) |
| `slate-muted` | `#4B6178` | `oklch(0.48 0.038 245)` | Muted body copy, breadcrumbs, item metadata (contrast > 5.5:1) |
| `border-light` | `#E2EEF7` | `oklch(0.93 0.018 242)` | Subtle 1px borders for cards, inputs, and dividers |
| `night-canvas` | `#060F1E` | `oklch(0.13 0.040 245)` | Dark mode page background |
| `night-card` | `#0D1E36` | `oklch(0.19 0.048 245)` | Dark mode card & modal container surface |
| `night-border` | `#1B3252` | `oklch(0.28 0.045 245)` | Dark mode 1px structural borders |

### 2.3 Semantic CSS Token Mapping (`globals.css`)

```css
:root {
  /* Canvas & Text */
  --background: oklch(0.99 0.006 242.5); /* #FAFCFE */
  --foreground: oklch(0.18 0.045 245);    /* #0B192C Aegean Slate */

  /* Containers & Popovers */
  --card: oklch(1.0 0 0);                /* #FFFFFF Pure White */
  --card-foreground: oklch(0.18 0.045 245);
  --popover: oklch(1.0 0 0);
  --popover-foreground: oklch(0.18 0.045 245);

  /* Primary Brand Blue Action */
  --primary: oklch(0.58 0.182 242);       /* #0082CA Mavi Blue */
  --primary-foreground: oklch(1.0 0 0);   /* Pure White */

  /* Secondary & Accents */
  --secondary: oklch(0.96 0.03 242);     /* #EBF5FC Soft Ice */
  --secondary-foreground: oklch(0.38 0.14 242);
  --accent: oklch(0.94 0.045 242);        /* #E0F1FD */
  --accent-foreground: oklch(0.32 0.15 242);

  /* Muted & Borders */
  --muted: oklch(0.96 0.015 242);
  --muted-foreground: oklch(0.48 0.038 245); /* High contrast muted text */
  --border: oklch(0.92 0.02 242);         /* Soft ice border */
  --input: oklch(0.92 0.02 242);
  --ring: oklch(0.58 0.182 242 / 45%);

  /* Radius & Shadows */
  --radius: 0.75rem;
}

.dark {
  --background: oklch(0.13 0.040 245);   /* #060F1E Deep Night Aegean */
  --foreground: oklch(0.98 0.01 242);    /* #F4F8FC */
  --card: oklch(0.18 0.045 245);          /* #0D1E36 */
  --card-foreground: oklch(0.98 0.01 242);
  --popover: oklch(0.18 0.045 245);
  --popover-foreground: oklch(0.98 0.01 242);

  --primary: oklch(0.64 0.185 242);       /* Electric Azure #1AA3FF */
  --primary-foreground: oklch(1.0 0 0);
  --secondary: oklch(0.23 0.05 245);
  --secondary-foreground: oklch(0.95 0.02 242);
  --accent: oklch(0.24 0.06 245);
  --accent-foreground: oklch(0.95 0.02 242);

  --muted: oklch(0.21 0.04 245);
  --muted-foreground: oklch(0.72 0.03 242);
  --border: oklch(0.28 0.045 245 / 70%);
  --input: oklch(0.28 0.045 245 / 70%);
  --ring: oklch(0.64 0.185 242 / 50%);
}
```

---

## 3. Typography & RTL Engineering

- **Primary Font:** Vazirmatn (`--font-vazirmatn`, system-ui, sans-serif) for all Persian text and numerals.
- **Secondary / Mono:** Geist Mono (`--font-mono`) for SKU codes, tracking numbers, and technical specifications.
- **Direction:** Native `dir="rtl"` with logical CSS properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`).
- **Purity Rule:** Headings are roman (`font-style: normal`). No italic emphasis inside Persian headlines (prevents clipping of Persian letters like `ی`, `گ`, `چ`).
- **Hierarchy Scale:**

| Level | Size (Desktop / Mobile) | Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / Hero** | `text-5xl md:text-7xl` | `font-black` (900) | `leading-[1.15]` | `tracking-tight` | Main homepage hero headline |
| **Heading 1** | `text-3xl md:text-4xl` | `font-extrabold` (800) | `leading-snug` | `tracking-tight` | Page titles, primary collection headings |
| **Heading 2** | `text-2xl md:text-3xl` | `font-bold` (700) | `leading-snug` | normal | Section titles, modal headers |
| **Heading 3** | `text-xl md:text-2xl` | `font-bold` (700) | `leading-relaxed` | normal | Product titles in cards, drawer titles |
| **Body Large** | `text-base md:text-lg` | `font-normal` / `500` | `leading-relaxed` | normal | Hero subtext, lead paragraphs |
| **Body Regular** | `text-sm md:text-base` | `font-normal` (400) | `leading-relaxed` | normal | Product descriptions, cart item details |
| **Caption / Meta** | `text-xs md:text-sm` | `font-medium` (500) | `leading-normal` | normal | Price labels, attributes, status tags |
| **Eyebrow / Badge**| `text-[11px]` | `font-bold` (700) | `leading-none` | `tracking-wide` | Category chips, collection badges |

---

## 4. Spacing, Radius & Materiality

### 4.1 Spacing Scale
- Base unit: 4px grid. Standard paddings:
  - Micro: `gap-1.5` (6px), `gap-2` (8px), `gap-3` (12px)
  - Layout: `p-4` (16px), `p-6` (24px), `p-8` (32px), `p-12` (48px)
  - Section dividers: `py-16 md:py-24`

### 4.2 Corner Radii (Shape Consistency Lock)
- **Interactive Pills:** `rounded-full` for all Primary Buttons, Chips, Category Tags, and Floating Navigation.
- **Surface Cards:** `rounded-2xl` (16px) for Product Cards, Collection Banners, Modal Dialogs.
- **Form Controls:** `rounded-xl` (12px) for Input fields, Dropdown menus, Select triggers.
- **Badges:** `rounded-full` with `px-3 py-1`.

### 4.3 Shadows & Glassmorphism
- **Azure Light Shadow:** `shadow-[0_10px_30px_-5px_rgba(0,130,202,0.12)]` (clean physical lift with azure hue, no harsh black mud).
- **Floating Nav Glass:** `bg-white/90 dark:bg-[#071324]/85 backdrop-blur-2xl border border-sky-100/80 dark:border-sky-500/20 shadow-xl shadow-sky-900/5`.
- **Card Hover Elevation:** `hover:shadow-[0_16px_36px_-6px_rgba(0,130,202,0.16)] hover:-translate-y-1 transition-all duration-300`.

---

## 5. Component Standards

### 5.1 Navbar
- **Structure:** Floating island pill (`max-w-5xl rounded-full h-16`), centered horizontally with `top-6`.
- **Palette:** Translucent white surface (`bg-white/90` with `backdrop-blur-2xl`), subtle border (`border-sky-100`), dark navy typography (`text-slate-800`), Mavi blue icon highlights (`hover:text-[#0082CA]`).
- **Interactive:** Search expander smoothly stretches with spring physics; badges indicate active cart and notification count in vibrant Mavi blue with white numerals.

### 5.2 Hero Section
- **Viewport Rule:** `min-h-[90vh] md:min-h-[100dvh]` (never bare `h-screen`).
- **Stack Discipline:** Maximum 4 text elements:
  1. Eyebrow badge (e.g. `کالکشن جدید ۲۰۲۶` inside Ice Blue pill with Mavi Blue text)
  2. Headline (Max 2 lines desktop, `leading-[1.15]`)
  3. Subtext (Max 20 words, high legibility)
  4. CTAs (Primary Mavi Blue button + Secondary Ice/White outline button)

### 5.3 Product Card
- **Aspect Ratio:** `aspect-[3/4]` or `aspect-[4/5]` for fashion photography with `object-cover`.
- **Background:** Crisp white card container with `border border-sky-100/70`.
- **Details:**
  - Category / Brand: Small uppercase Mavi blue caption (`text-[#0082CA] text-xs font-semibold`).
  - Title: Slate heading, 1-2 lines clamped (`line-clamp-1` or `line-clamp-2`).
  - Price: Clean Toman formatting with formatted Persian digits (`lib/price-utils.ts`).
  - Action: Quick add-to-cart pill or favorite heart button with tactile spring feedback.

### 5.4 Buttons & Interactive CTAs
- **Primary CTA:**
  - Background: Mavi Blue `#0082CA` (`bg-[#0082CA]` / `bg-primary`)
  - Label: Pure White `#FFFFFF` (`text-white font-bold`)
  - Hover: Deeper Azure `#006CA8` (`hover:bg-[#006CA8]`)
  - Active: Scale `active:scale-[0.98]`
  - Shadow: `shadow-md shadow-sky-500/25`
  - Rule: Label must NEVER wrap to two lines at desktop. Max 3 words.
- **Secondary CTA:**
  - Background: Ice Blue `#F0F8FF` (`bg-sky-50`)
  - Text: Mavi Blue `#006CA8` (`text-[#006CA8] font-semibold`)
  - Border: Subtle sky border (`border border-sky-200/60`)
  - Hover: `hover:bg-sky-100`

---

## 6. The 8-State Interactive Checklist

Every interactive component MUST explicitly style the following 8 states:
1. **Default:** Crisp border, calibrated background, readable contrast.
2. **Hover:** Tint shift, soft blue elevation, smooth cursor pointer.
3. **Focus-Visible:** Accessible outline ring `ring-2 ring-[#0082CA]/50 ring-offset-2`.
4. **Active (Pressed):** Physical push feel with `scale-[0.98]` or `-translate-y-[1px]`.
5. **Disabled:** Opacity 50%, `cursor-not-allowed`, non-reactive.
6. **Loading:** Inline spinner (`Loader2` from Lucide in Mavi blue or white), button remains fixed width without layout shift.
7. **Error:** Red destructive accent (`oklch(0.577 0.245 27.325)`), accessible error label below control.
8. **Success:** Emerald confirmation badge (`oklch(0.65 0.20 150)`) with tactile micro-shake or checkmark reveal.

---

## 7. Motion & Animation Choreography

- **Library:** Framer Motion (`motion/react` / `framer-motion`).
- **Spring Standard:** `type: "spring", stiffness: 350, damping: 30` (snappy, physical, zero artificial float).
- **Page Transitions:** Staggered fade & vertical rise (`initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}`).
- **Accessibility:** ALWAYS respect `prefers-reduced-motion` via `useReducedMotion()`. If reduced motion is requested, render instant states without transforms.

---

## 8. Anti-Patterns & Hard Bans

1. **NO AI Purple / Violet Slop:** Never use purple button glows or neon mesh gradients. The palette is strictly Mavi Blue & White.
2. **NO Emoji Icons:** Never use emojis (👕, 👗, 💎) as UI controls or category icons. Always use SVG icons from `lucide-react`.
3. **NO Unreadable Text on Buttons:** Never put white text on a white button or light blue text on a white background without passing 4.5:1 contrast.
4. **NO Layout-Shifting Hovers:** Never increase borders or element widths on hover; use box-shadow, background-color, or opacity changes.
5. **NO Unmotivated Scroll Hijacking:** Never hijack native browser scroll unless in an isolated carousel component.
6. **NO Broken RTL Layouts:** Always verify chevron arrows, drawer slide-ins, and alignment follow right-to-left conventions.

---

## 9. Implementation & Maintenance Checklist for Agents

Before committing any UI code:
- [ ] Colors use the Mavi Blue spectrum (`#0082CA`, `#0091DF`, `#F0F8FF`, `#FFFFFF`, `#0B192C`) or semantic variables (`var(--primary)`, `var(--background)`, etc.).
- [ ] Button text passes WCAG AA contrast (4.5:1 min).
- [ ] Interactive elements have `cursor-pointer` and active tactile feedback.
- [ ] No hardcoded English numbers where Persian localized formatting is required.
- [ ] Responsive behavior tested and validated at 375px, 768px, 1024px, and 1440px.
- [ ] No horizontal scrollbars (`overflow-x: clip` or `hidden` on container).
