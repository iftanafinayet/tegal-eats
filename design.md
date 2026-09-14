# F&B Soft Clay Design System

**Version:** 1.0  
**Platform:** Responsive Web Application  
**Visual style:** Soft Claymorphism, Airy UI, Rounded Mobile Cards  
**Use case:** Restaurant, café, bakery, beverage, cloud kitchen, and food ordering

---

## 1. Design Direction

The interface uses a light and friendly **soft claymorphism** style inspired by the visual reference. The design combines rounded white surfaces, soft blue backgrounds, layered shadows, bright gradients, and small colorful accents.

Food photography remains the main visual focus. Clay effects are used to support hierarchy and interaction, not to decorate every element.

### Core principles

1. **Food First** — menu photography, product name, price, and ordering action must be immediately visible.
2. **Soft and Friendly** — rounded geometry and diffused shadows create a welcoming experience.
3. **Clear Actions** — primary actions use solid blue gradients and strong contrast.
4. **Lightweight Surfaces** — white cards sit above a pale-blue environment with generous spacing.
5. **Controlled Color** — bright colors identify categories and states without making the interface noisy.
6. **Mobile First** — ordering, cart management, and checkout must be comfortable with one hand.

---

## 2. Visual Personality

| Attribute | Direction |
|---|---|
| Mood | Fresh, cheerful, clean, approachable |
| Shape | Rounded rectangles, circles, organic blobs |
| Surface | Matte white with soft raised depth |
| Depth | Wide diffused outer shadows and subtle inner highlights |
| Illustration | Soft 3D food or ingredient objects |
| Photography | Bright, natural, appetizing, clean background |
| Animation | Gentle floating, scale, slide, and spring motion |

### Recommended theme name

**Fresh Cloud Kitchen**

This is a soft-clay F&B theme with sky-blue surfaces, cloud-like cards, colorful category accents, and warm food photography.

---

## 3. Color System

### Brand colors

| Token | Value | Usage |
|---|---:|---|
| `--primary-500` | `#27AEEB` | Primary CTA, active navigation, links |
| `--primary-600` | `#148ED1` | Hover and pressed states |
| `--primary-300` | `#74D1F7` | Highlights and gradient endpoint |
| `--primary-100` | `#DDF4FF` | Selected backgrounds and soft badges |
| `--canvas` | `#EAF8FF` | Main page background |
| `--surface` | `#FFFFFF` | Cards, navbar, modal, checkout panel |
| `--surface-soft` | `#F7FBFD` | Search field and secondary container |

### Text colors

| Token | Value | Usage |
|---|---:|---|
| `--text-primary` | `#20252A` | Heading and primary information |
| `--text-secondary` | `#6F7A83` | Description and supporting copy |
| `--text-muted` | `#AAB4BC` | Placeholder and disabled information |
| `--text-on-primary` | `#FFFFFF` | Text above blue surfaces |

### F&B accent colors

| Token | Value | Usage |
|---|---:|---|
| `--accent-mango` | `#FFC83D` | Promo, rating, recommended menu |
| `--accent-coral` | `#FF6B72` | Spicy indicator, discount, favorite |
| `--accent-mint` | `#55D6BE` | Fresh, vegetarian, available |
| `--accent-grape` | `#9075E8` | Dessert category |
| `--accent-orange` | `#FF9B50` | Popular menu and warm highlights |
| `--danger` | `#E84B55` | Error and destructive action |
| `--success` | `#27AE78` | Successful order and payment |

### Gradient

```css
--gradient-primary: linear-gradient(135deg, #45C4F3 0%, #168FD4 100%);
--gradient-promo: linear-gradient(135deg, #20A8E8 0%, #2FB9EE 72%, #FFC83D 72%);
--gradient-background: linear-gradient(180deg, #DDF5FF 0%, #F8FCFE 100%);
```

Do not place body text directly over a busy gradient or food image without a solid or blurred overlay.

---

## 4. Typography

### Font family

- **Primary:** `Plus Jakarta Sans`
- **Fallback:** `Inter`, `system-ui`, `sans-serif`
- Use one family across the product to maintain the clean, modern appearance.

### Type scale

| Style | Desktop | Mobile | Weight | Line height |
|---|---:|---:|---:|---:|
| Display | 56px | 38px | 700 | 1.12 |
| H1 | 44px | 32px | 700 | 1.20 |
| H2 | 34px | 26px | 700 | 1.25 |
| H3 | 26px | 21px | 700 | 1.30 |
| Title | 20px | 18px | 600 | 1.35 |
| Body | 16px | 15px | 400 | 1.60 |
| Small | 14px | 13px | 400 | 1.50 |
| Label | 12px | 12px | 600 | 1.40 |

- Prices use weight `700`.
- Menu descriptions use secondary text and a maximum of two lines in cards.
- Avoid using all caps except for very short labels.

---

## 5. Shape, Radius, and Spacing

### Border radius

| Token | Value | Usage |
|---|---:|---|
| `--radius-sm` | `10px` | Badge and compact input |
| `--radius-md` | `16px` | Button and menu item |
| `--radius-lg` | `24px` | Main card and form panel |
| `--radius-xl` | `32px` | Hero, modal, floating checkout panel |
| `--radius-pill` | `999px` | Category chip and floating button |

### Spacing scale

Use an 8px base grid: `4, 8, 12, 16, 24, 32, 40, 48, 64, 80`.

- Mobile page padding: `16px`
- Tablet page padding: `24px`
- Desktop content padding: `32–48px`
- Maximum content width: `1200px`
- Standard card gap: `16–24px`

---

## 6. Claymorphism and Elevation

Claymorphism must appear soft and modern, never heavy or plastic.

```css
:root {
  --shadow-card:
    14px 18px 36px rgba(37, 139, 187, 0.16),
    -8px -8px 22px rgba(255, 255, 255, 0.85);

  --shadow-button:
    0 10px 20px rgba(20, 142, 209, 0.30),
    inset 0 2px 2px rgba(255, 255, 255, 0.38),
    inset 0 -3px 6px rgba(4, 103, 160, 0.18);

  --shadow-floating:
    0 14px 32px rgba(32, 130, 180, 0.28),
    inset 0 2px 3px rgba(255, 255, 255, 0.42);

  --shadow-inset:
    inset 3px 3px 8px rgba(87, 139, 163, 0.10),
    inset -3px -3px 8px rgba(255, 255, 255, 0.90);
}
```

### Elevation rules

- **Level 0:** background and flat content.
- **Level 1:** search field, category chip, quantity selector.
- **Level 2:** product card, order card, navigation bar.
- **Level 3:** floating cart, modal, primary floating action button.
- Use no more than three elevated components in one visual cluster.

---

## 7. Iconography and Imagery

### Icons

- Use rounded outline icons such as **Lucide Icons**.
- Standard stroke: `1.75–2px`.
- Default size: `20px`; navigation: `22–24px`.
- Active icons may use a solid blue fill or sit inside a raised blue circle.

### Food imagery

- Use real product photos for menu cards and hero content.
- Maintain consistent lighting, crop, and background across products.
- Product image ratio: `1:1` for grid cards and `4:3` for featured cards.
- Images must use `object-fit: cover` and follow the card radius.
- Soft 3D illustrations may appear in onboarding, empty states, or promotional banners.
- Do not replace real menu photos with illustrations when purchase decisions depend on appearance.

### Decorative elements

Use blurred blue circles, small ingredient shapes, and translucent organic blobs in empty background areas. They must not block navigation, text, food, prices, or buttons.

---

## 8. Core Components

### 8.1 Navigation

**Desktop:** floating rounded navbar with logo, Menu, Promo, About, Contact, search, and cart.  
**Mobile:** fixed bottom navigation with Home, Menu, Orders, Profile, plus a raised center Cart button.

- Surface: white
- Radius: `24–28px`
- Height: desktop `72px`, mobile `72–80px`
- Active state: primary blue
- Bottom navigation must include safe-area padding.

### 8.2 Primary button

- Height: `48–52px`
- Radius: pill or `16px`
- Background: `--gradient-primary`
- Text: white, weight `600`
- Use the clay button shadow.
- Hover: move upward `-2px` and slightly increase brightness.
- Pressed: move to `0`, reduce shadow, and scale to `0.98`.
- Focus: `3px` primary-100 ring plus a visible primary-600 outline.

### 8.3 Secondary button

- White or primary-100 surface
- Primary-600 text
- Subtle shadow; no strong gradient

### 8.4 Category chip

- Pill shape with icon and label
- Default: white surface, secondary text
- Active: primary-500 background, white text
- Category accents may be used for Dessert, Drinks, Main Course, Snack, and Healthy.

### 8.5 Menu card

Each menu card contains:

1. Product image
2. Favorite control
3. Category or status badge
4. Product name
5. Short description
6. Rating and preparation time
7. Price
8. Add-to-cart button

Recommended behavior:

- Mobile: horizontal compact card or two-column grid
- Desktop: three or four-column grid
- Card radius: `24px`
- Card padding: `12–16px`
- Image radius: `18–20px`
- Place price and add button on the same final row.

### 8.6 Search field

- Height: `48px`
- Background: surface-soft
- Border: none by default
- Radius: `14–16px`
- Use the inset shadow sparingly.
- Placeholder example: `Cari makanan atau minuman...`

### 8.7 Promo banner

- Blue gradient background with one yellow or coral accent area.
- Use short copy, one CTA, and one isolated food image or 3D object.
- Keep a minimum contrast ratio of `4.5:1` for normal text.

### 8.8 Quantity selector

- Rounded white container with minus, count, and plus controls.
- Minimum touch target: `44 × 44px`.
- Disabled minus button when quantity is one, unless removal is explicitly communicated.

### 8.9 Floating cart

- Circular or pill-shaped blue elevated button.
- Displays item count badge and optionally subtotal.
- Mobile position: centered above bottom navigation or bottom-right.
- Must never cover checkout actions or form inputs.

### 8.10 Modal and bottom sheet

- Desktop uses a centered modal with radius `32px`.
- Mobile uses a bottom sheet with top radius `28px`.
- Overlay: `rgba(16, 43, 56, 0.35)` with optional `backdrop-filter: blur(6px)`.
- Glassmorphism is allowed only on the overlay layer, not as the primary visual style.

---

## 9. Page Templates

### Landing page

1. Floating navbar
2. Hero with headline, short description, CTA, and food visual
3. Menu categories
4. Best sellers
5. Promotional banner
6. Recommended menu
7. Customer reviews
8. Location and operating hours
9. Footer

### Menu page

1. Page title and cart summary
2. Search input
3. Horizontally scrollable category chips
4. Filter and sorting controls
5. Responsive menu grid
6. Floating cart on mobile

### Product detail

1. Large product photo
2. Product name, rating, description, and price
3. Variant and topping selection
4. Notes field
5. Quantity selector
6. Sticky `Tambah ke Keranjang` button

### Checkout

1. Order items
2. Delivery or pickup method
3. Customer and address information
4. Voucher
5. Payment method
6. Cost breakdown
7. Sticky confirmation button

### Order tracking

Use soft colored status cards for `Order received`, `Preparing`, `Ready`, and `Completed`. Current status uses primary blue; completed states use mint; canceled uses coral.

---

## 10. Responsive Behavior

| Breakpoint | Width | Layout |
|---|---:|---|
| Mobile | `< 640px` | Single flow, bottom navigation, sticky actions |
| Tablet | `640–1023px` | Two-column content where appropriate |
| Desktop | `≥ 1024px` | Centered container, three/four-column menu grid |

- Avoid fixed card widths on mobile.
- Horizontal chip rows may scroll without showing a scrollbar.
- Checkout summary becomes a sticky right column on desktop.
- On mobile, important actions remain within thumb reach.

---

## 11. Interaction and Motion

| Interaction | Motion |
|---|---|
| Card hover | Translate `-4px`, shadow increases softly |
| Button hover | Translate `-2px`, brightness `1.03` |
| Button press | Scale `0.98`, duration `120ms` |
| Add to cart | Product/button pulse and cart badge bounce |
| Page content | Fade and rise `8–12px` |
| Decorative object | Slow floating loop, maximum `6px` movement |

- Standard duration: `180–240ms`
- Page transition: maximum `320ms`
- Preferred easing: `cubic-bezier(0.22, 1, 0.36, 1)`
- Respect `prefers-reduced-motion` and remove decorative looping animations.

---

## 12. Accessibility

- Normal text must reach at least WCAG AA contrast (`4.5:1`).
- Large text and icons must reach at least `3:1`.
- Never communicate spicy level, availability, or order status through color alone.
- All interactive controls require visible keyboard focus.
- Touch targets must be at least `44 × 44px`.
- Provide alt text for meaningful food images.
- Keep body copy at least `15px` on mobile.
- Inputs must retain visible labels; placeholders are not labels.
- Support zoom up to 200% without hiding primary actions.

---

## 13. CSS Foundation

```css
:root {
  --primary-100: #ddf4ff;
  --primary-300: #74d1f7;
  --primary-500: #27aeeb;
  --primary-600: #148ed1;

  --canvas: #eaf8ff;
  --surface: #ffffff;
  --surface-soft: #f7fbfd;

  --text-primary: #20252a;
  --text-secondary: #6f7a83;
  --text-muted: #aab4bc;

  --accent-mango: #ffc83d;
  --accent-coral: #ff6b72;
  --accent-mint: #55d6be;
  --accent-grape: #9075e8;

  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 32px;
  --radius-pill: 999px;

  --gradient-primary: linear-gradient(135deg, #45c4f3 0%, #168fd4 100%);
  --shadow-card: 14px 18px 36px rgba(37, 139, 187, 0.16),
                 -8px -8px 22px rgba(255, 255, 255, 0.85);
  --shadow-button: 0 10px 20px rgba(20, 142, 209, 0.30),
                   inset 0 2px 2px rgba(255, 255, 255, 0.38),
                   inset 0 -3px 6px rgba(4, 103, 160, 0.18);
}

body {
  margin: 0;
  color: var(--text-primary);
  background: linear-gradient(180deg, #ddf5ff 0%, #f8fcfe 100%);
  font-family: "Plus Jakarta Sans", Inter, system-ui, sans-serif;
}

.clay-card {
  background: var(--surface);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.primary-button {
  min-height: 48px;
  padding: 0 24px;
  color: #fff;
  background: var(--gradient-primary);
  border: 0;
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-button);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: transform 200ms ease, filter 200ms ease, box-shadow 200ms ease;
}
```

---

## 14. Do and Don't

### Do

- Use large, clean food imagery as the visual anchor.
- Keep surfaces white and backgrounds pale blue.
- Use soft shadows consistently to show hierarchy.
- Reserve saturated colors for actions, promos, and status.
- Keep checkout controls simple and highly legible.
- Use 3D elements only as supporting decoration.

### Don't

- Do not apply heavy shadows to every text block and icon.
- Do not use full glassmorphism across product cards.
- Do not put pale-gray text on white surfaces.
- Do not use more than three accent colors in a single section.
- Do not let decorations compete with food images.
- Do not sacrifice readability to imitate the reference literally.

---

## 15. Final Design Formula

> **70% clean white surfaces + 20% sky-blue environment + 10% colorful F&B accents**

The final interface should feel like a friendly food-ordering product placed inside a soft, airy, cloud-like environment: playful enough to be memorable, but clear enough to complete an order quickly.
