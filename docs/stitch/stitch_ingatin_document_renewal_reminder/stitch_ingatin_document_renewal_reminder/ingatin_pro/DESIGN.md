---
name: Ingatin Pro
colors:
  surface: '#fbf8ff'
  surface-dim: '#d8d9e9'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f2ff'
  surface-container: '#ececfe'
  surface-container-high: '#e7e7f8'
  surface-container-highest: '#e1e1f2'
  on-surface: '#191b27'
  on-surface-variant: '#484556'
  inverse-surface: '#2e303c'
  inverse-on-surface: '#f0efff'
  outline: '#797588'
  outline-variant: '#c9c4d9'
  surface-tint: '#5d36ef'
  primary: '#5427e6'
  on-primary: '#ffffff'
  primary-container: '#6d4aff'
  on-primary-container: '#f4eeff'
  inverse-primary: '#c9bfff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#794b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#9a6100'
  on-tertiary-container: '#ffeedf'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5deff'
  primary-fixed-dim: '#c9bfff'
  on-primary-fixed: '#1b0063'
  on-primary-fixed-variant: '#4500d8'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#fbf8ff'
  on-background: '#191b27'
  surface-variant: '#e1e1f2'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  label-xs:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1.25rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system is crafted specifically for Indonesian consumers navigating recurring administrative deadlines—such as SIM, STNK, Pajak Kendaraan Bermotor (PKB), KIR, Paspor, and Polis Asuransi. The brand personality balances effortless precision with approachable clarity: dependable, proactive, stress-free, and distinctly contemporary.

Visually, the style merges **Modern Indonesian Consumer Tech** with **Clean Minimalism**. It avoids administrative clutter by relying on spacious layouts, friendly geometry, high legibility, and glanceable status communication. Instead of inducing anxiety around missed legal deadlines, the UI instills a feeling of organized control through clear color-coded thresholds, airy card-based modules, and warm, conversational Bahasa Indonesia copy.

## Colors

The palette is engineered around an authoritative yet friendly primary hue complemented by unequivocal deadline indicators:

- **Primary (`#6D4AFF`)**: Vibrant Royal Purple representing modern digital convenience, used for key CTAs, selected tabs, progress highlights, and branded focal points.
- **Secondary / Safe Status (`#10B981`)**: Emerald Green denoting safe statuses (> 30 days until due date), verified documents, and successful renewals.
- **Tertiary / Warning Status (`#F59E0B`)**: Warm Amber signaling caution and upcoming deadlines within 8–30 days.
- **Critical / Danger Status (`#EF4444`)**: Vivid Coral Red designating urgent deadlines (≤ 7 days) and overdue fines or expired validity.
- **Neutral Dark (`#1E202C`)**: Deep Charcoal-Slate providing optimal contrast for primary headlines and data values, avoiding the harshness of pure black.
- **Neutral Muted (`#64748B`)**: Secondary text for descriptions, helper text, and metadata labels.
- **Canvas (`#F8F9FD`)**: Crisp, ultra-soft lavender-tinted grey canvas that provides natural separation for elevated cards.
- **Surface (`#FFFFFF`)**: Pure white base for cards, sheets, and interactive controls.
- **Border / Hairline (`#ECEEF5`)**: Delicate light neutral for crisp container separations and form borders without visual noise.

## Typography

The design system adopts **Plus Jakarta Sans** across all roles. Its geometric humanist structure, open apertures, and balanced counterforms yield exceptional legibility on mobile screens, especially for formatted Indonesian administrative data (e.g., Plat Nomor `B 1234 XYZ`, NIK, Masa Berlaku, and Rupiah currency strings `Rp 1.250.000`).

- Headlines leverage semibold and bold weights with subtle negative tracking for punchy, compact titles.
- Body copy relies on generous line heights to facilitate effortless scanning across lists and verification steps.
- Labels utilize uppercase tracking for badge tags (`AKTIF`, `PERLU PERPANJANGAN`, `KEDALUWARSA`) and medium-to-bold weights for numeric deadlines (e.g., `H-3 HARI`).

## Layout & Spacing

The layout is built mobile-first around a fluid container bounded by standard 16px to 20px screen margins. Content conforms to an 8pt base grid with an inner 4pt sub-grid for fine iconography and text alignments.

- **Mobile Viewport (< 600px)**: Primary focus. Uses `margin-sm` (16px) or `margin` (20px) horizontal padding. Cards span full width between margins with stacked vertical rhythms spaced by `space-md` (16px) or `space-sm` (8px).
- **Tablet / Large Mobile (600px - 1024px)**: Uses 2-column card layouts with 16px gutter spacing (`gutter`) and safe margins of 24px (`space-lg`).
- **Vertical Rhythm**: Related elements (label and value) stay tied with `space-xs` (4px) to `space-sm` (8px), while distinct document sections decouple via `space-lg` (24px) to `space-xl` (32px).

## Elevation & Depth

Visual hierarchy relies on clean surface layering paired with custom ambient shadows tinted with the primary hue:

- **Surface Layering**: The `#F8F9FD` background provides atmospheric contrast beneath pristine `#FFFFFF` card surfaces. Sub-sections within cards (such as detail rows or input backdrops) use a subtle `#F1F3F9` tint.
- **Card Ambient Shadow**: Cards receive an ultra-soft, diffused shadow: `0 4px 20px -2px rgba(109, 74, 255, 0.06)`. This subtle purple tint eliminates harsh grey muddiness and creates a light, floating appearance.
- **Floating Action Buttons & Modals**: Raised components, bottom sheets, and sticky CTA bars employ `0 12px 32px -4px rgba(30, 32, 44, 0.10)`.
- **Low-Contrast Outlines**: Every card and input container utilizes a `1px` crisp border in `#ECEEF5` to maintain structural definition on high-brightness AMOLED and LCD screens without heavy drop shadows.

## Shapes

The interface embraces a friendly, rounded aesthetic tailored to mobile interaction:

- **Cards & Sheets**: Set consistently to `rounded-lg` (16px / `1rem`), providing smooth corners that guide the eye inward to document expiration details.
- **Buttons & Input Fields**: Scaled with 12px to 16px corner radii to maintain soft, tactile tap targets.
- **Badges & Status Chips**: Employ fully rounded pill geometries (`rounded-full` / `9999px`) to emphasize categorical status without competing with rectangular document boundaries.
- **Inner Avatars & Document Icons**: Use 12px to 14px continuous curvature rounded squares.

## Components

### Buttons
- **Primary Button**: Solid `#6D4AFF` background, pure white text, 48px to 52px height, 14px `rounded-lg` radius, font `label-lg`. Subdued hover/active scale with slight opacity change (`#5B3CE0`).
- **Secondary / Outline Button**: Pure white surface, 1.5px border `#ECEEF5`, text `#1E202C`, active state transitions border to `#6D4AFF`.
- **Ghost / Tertiary Button**: Borderless, `#6D4AFF` text, for tertiary actions such as "Lihat Riwayat" or "Batal".

### Document Deadline Cards
- Surface `#FFFFFF`, border `1px solid #ECEEF5`, radius 16px, ambient shadow `rgba(109,74,255, 0.06)`.
- Top row houses the document category icon (SIM, STNK, Paspor), title (e.g. "STNK Honda Vario"), identifier (e.g. "B 4521 KAA"), and status chip.
- Bottom area highlights the countdown badge (e.g., `Sisa 5 Hari`) and the renewal action trigger.
- Left status accent: Optional 4px rounded indicator line tinted according to status (Red, Amber, or Green).

### Status Chips & Pills
- Fully rounded pill radius (`9999px`), 24px height, horizontal padding 10px.
- **Safe (> 30 days)**: Background `#ECFDF5`, text and dot icon `#10B981` ("Aman").
- **Warning (8–30 days)**: Background `#FFFBEB`, text and dot icon `#F59E0B` ("Segera Perpanjang").
- **Critical / Overdue (≤ 7 days)**: Background `#FEF2F2`, text and dot icon `#EF4444` ("Mendesak" or "Kedaluwarsa").

### Form Fields & Inputs
- Height 48px, radius 12px, border `1.5px solid #ECEEF5`, background `#FFFFFF`.
- Typography `body-md` in `#1E202C`, placeholder in `#94A3B8`.
- Focus state: Border transitions to `#6D4AFF` with a 3px outer glow ring `rgba(109, 74, 255, 0.12)`.
- Includes trailing calendar icon or camera scanner trigger for OCR document scanning.

### Checkboxes & Toggle Controls
- Checkbox: 20x20px, 6px radius. Unchecked `#ECEEF5` border; checked `#6D4AFF` with crisp white checkmark.
- Switch Toggle: Pill background, `#10B981` or `#6D4AFF` active track, 24px pure white thumb. Used for "Kirim Pengingat WhatsApp" and "Notifikasi Push".

### Lists & Activity Rows
- Divided by a 1px hairline border `#ECEEF5` or floating as independent 12px-radius cards.
- Left-aligned icon wrapper with 10% opacity tint of category color, central title and timestamp, right-aligned nominal tax amount (e.g., `Rp 350.000`) or expiry date.