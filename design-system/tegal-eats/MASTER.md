# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Tegal Eats
**Generated:** 2026-09-14 13:32:18
**Category:** Restaurant/Food Service

---

## Implemented Direction: Fresh Cloud Kitchen (design.md v1.0)

This project implements `design.md` — **soft claymorphism F&B, airy UI, rounded mobile cards**. This direction overrides the generated style below where they conflict.

- Formula: 70% white surfaces + 20% sky-blue environment + 10% colorful F&B accents.
- Canvas: `#EAF8FF` with gradient `#DDF5FF → #F8FCFE`; cards stay white.
- Primary: sky blue `#27AEEB`, hover/pressed `#148ED1`, soft `#DDF4FF`.
- Accents: mango `#FFC83D`, coral `#FF6B72`, mint `#55D6BE`, grape `#9075E8`, orange `#FF9B50`.
- Status: danger `#E84B55`, success `#27AE78`.
- Text: `#20252A` primary, `#4D5A64` secondary, muted `#7D8B94` (muted never for body on white).
- Radius: 10 / 16 / 24 / 32 / pill 999px. Main cards 24px, hero/modal 32px.
- Type: single family Plus Jakarta Sans; prices 700; descriptions max 2 lines; min 15px mobile body.
- Touch: minimum 44px targets; content max 1200px; mobile page padding 16px.
- Motion: 180–240ms, page max 320ms, easing `cubic-bezier(0.22,1,0.36,1)`; card hover -4px, button hover -2px + brightness 1.03, press scale .98; decorative float max 6px; reduced-motion respected.
- Elevation max 3 per cluster; decorations never cover food, price, or actions.
- Admin keeps dark minimal treatment.

### Clay Tokens (from design.md §6 + §13)

```css
--primary-500: #27aeeb;
--primary-600: #148ed1;
--gradient-primary: linear-gradient(135deg, #45c4f3 0%, #168fd4 100%);
--gradient-promo: linear-gradient(135deg, #20a8e8 0%, #2fb9ee 72%, #ffc83d 72%);
--shadow-card: 14px 18px 36px rgba(37,139,187,.16), -8px -8px 22px rgba(255,255,255,.85);
--shadow-button: 0 10px 20px rgba(20,142,209,.30), inset 0 2px 2px rgba(255,255,255,.38), inset 0 -3px 6px rgba(4,103,160,.18);
--shadow-floating: 0 14px 32px rgba(32,130,180,.28), inset 0 2px 3px rgba(255,255,255,.42);
--shadow-inset: inset 3px 3px 8px rgba(87,139,163,.10), inset -3px -3px 8px rgba(255,255,255,.90);
```

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#27AEEB` | `--color-primary` |
| Secondary | `#FF9B50` | `--color-secondary` |
| CTA/Accent | `#FFC83D` | `--color-cta` |
| Background | `#EAF8FF` | `--color-background` |
| Text | `#20252A` | `--color-text` |

**Color Notes:** Fresh Cloud Kitchen — sky blue + white + mango/coral/mint/grape accents

### Typography

- **Heading Font:** Plus Jakarta Sans
- **Body Font:** Plus Jakarta Sans
- **Mood:** fresh, cheerful, clean, approachable
- **Google Fonts:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600;700&family=Playfair+Display+SC:wght@400;700&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #CA8A04;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #DC2626;
  border: 2px solid #DC2626;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #FEF2F2;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #DC2626;
  outline: none;
  box-shadow: 0 0 0 3px #DC262620;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Vibrant & Block-based

**Keywords:** Bold, energetic, playful, block layout, geometric shapes, high color contrast, duotone, modern, energetic

**Best For:** Startups, creative agencies, gaming, social media, youth-focused, entertainment, consumer

**Key Effects:** Large sections (48px+ gaps), animated patterns, bold hover (color shift), scroll-snap, large type (32px+), 200-300ms

### Page Pattern

**Pattern Name:** App Store Style Landing

- **Conversion Strategy:** Show real screenshots. Include ratings (4.5+ stars). QR code for mobile. Platform-specific CTAs.
- **CTA Placement:** Download buttons prominent (App Store + Play Store) throughout
- **Section Order:** 1. Hero with device mockup, 2. Screenshots carousel, 3. Features with icons, 4. Reviews/ratings, 5. Download CTAs

---

## Anti-Patterns (Do NOT Use)

- ❌ Low-quality imagery
- ❌ Outdated hours

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
