# Design System Strategy: Precision Fluidity

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Precision Curator."** 

To move beyond a generic "fintech" template, we must treat the mobile interface as a high-end editorial piece. This system rejects the rigid, boxy constraints of traditional financial apps in favor of intentional asymmetry and tonal depth. We are building an environment that feels as reliable as a private bank but as fluid as a modern tech startup. 

We break the "standard" look by utilizing extreme typographic contrast—pairing oversized, authoritative headlines with hyper-functional, utilitarian body text—and by replacing structural lines with physical layering. The result is a UI that doesn't just display data; it curates it.

---

## 2. Colors & Signature Textures
The palette is anchored by **Midnight Blue (Primary)** for authority and **Mobility Green (Secondary)** for momentum and action.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts or tonal transitions.
*   Use `surface` (`#f8f9fa`) as your base.
*   Define sections using `surface-container-low` (`#f3f4f5`) or `surface-container-high` (`#e7e8e9`).
*   The human eye perceives the change in value as a boundary; adding a line is a redundant "crutch" that clutters the high-end aesthetic.

### Surface Hierarchy & Nesting
Treat the UI as stacked sheets of fine paper. 
*   **Level 0 (Base):** `surface`
*   **Level 1 (Sections):** `surface-container`
*   **Level 2 (Interactive Cards):** `surface-container-lowest` (pure white `#ffffff`) to create a "lifted" effect against the slightly grey background.

### The "Glass & Gradient" Rule
To inject "visual soul," use subtle gradients for primary CTAs and hero elements. Transition from `primary` (`#020135`) to `primary_container` (`#1a1b4b`) at a 135-degree angle. 
For floating elements (like a sticky wallet balance), apply **Glassmorphism**: use `surface` at 70% opacity with a `20px` backdrop-blur.

---

## 3. Typography
This system utilizes a dual-font strategy to balance character with readability.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision. Use `display-lg` (3.5rem) for hero moments and empty states to create an editorial, high-fashion feel.
*   **Body & Labels (Inter):** The workhorse. Use `body-md` (0.875rem) for primary data. Inter provides the "high-tech" fintech reliability required for transaction histories and wallet details.
*   **Editorial Contrast:** Don't be afraid of the scale. A `headline-lg` should sit confidently near a `label-sm`. This gap in scale is what makes the design feel "designed" rather than "templated."

---

## 4. Elevation & Depth
In this system, depth is a product of light and layering, not artificial shadows.

*   **The Layering Principle:** Achieve hierarchy by "nesting" tokens. A `surface-container-lowest` card sitting on a `surface-container-low` section creates a soft, natural lift without a single shadow.
*   **Ambient Shadows:** If an element must "float" (e.g., a sticky bottom button), use a shadow with a **40px blur** and **4% opacity**. The shadow color must be a tint of `on-surface` (`#191c1d`), never pure black.
*   **The "Ghost Border" Fallback:** If accessibility requirements demand a border, use the `outline-variant` (`#c8c5d0`) at **15% opacity**. This creates a "hint" of a container without breaking the "No-Line" rule.
*   **Glassmorphism Depth:** Use backdrop-blurs on `surface_bright` layers to allow the rich Midnight Blue of the background to bleed through, softening the edges of the UI.

---

## 5. Components

### Buttons
*   **Primary:** `secondary` (Mobility Green) background with `on_secondary` text. Use `rounded-full` (9999px) for a high-tech, aerodynamic feel.
*   **Secondary:** `primary` (Midnight Blue) with a subtle gradient to `primary_container`. 
*   **Sticky Bottom Buttons:** These must always be `rounded-xl` and sit on a glassmorphic bar (backdrop-blur) to ensure they feel like they are floating over the content.

### Fintech Wallet Elements
*   **The Wallet Card:** Use a `primary` background. Do not use borders. Use a `surface-tint` at 10% opacity as a decorative overlay to create a "tech-circuit" or "micro-texture" feel.
*   **Transaction Chips:** Use `secondary_container` for positive cash flow and `error_container` for expenses. Keep them `rounded-md`.

### Cards & Lists
*   **Prohibition:** No divider lines between list items. 
*   **Separation:** Use `8px` of vertical white space (Spacing Scale) or alternating tonal shifts between `surface-container-lowest` and `surface-container-low`.
*   **Roundedness:** All cards must use `rounded-xl` (1.5rem) to maintain the "modern, minimalist" prompt requirement.

### Input Fields
*   **Styling:** Use `surface_container_highest` for the background. No border.
*   **Focus State:** A "Ghost Border" of `secondary` (Mobility Green) at 40% opacity. This feels "high-tech" and responsive without being heavy-handed.

---

## 6. Do's and Don'ts

### Do
*   **DO** use whitespace as a functional element. If a screen feels crowded, increase the padding to `2rem` (xl) rather than adding a divider.
*   **DO** use "Mobility Green" sparingly. It is a high-energy accent; overusing it will diminish its power as an "action" signal.
*   **DO** experiment with asymmetric layouts—for example, a `display-sm` headline aligned left with a `body-md` description offset to the right.

### Don't
*   **DON'T** use 100% black. Use `on_surface` (`#191c1d`) for text to maintain a premium, ink-like softness.
*   **DON'T** use standard Material Design drop shadows. If it looks like a "default," it’s wrong. Aim for "Ambient" and "Diffuse."
*   **DON'T** use icons from different libraries. Use a single, clean, light-stroke (2px) icon set to match the "Precision" North Star.