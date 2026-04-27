# Mockup Notes — mockup_v1.jpeg

Read the JPEG. These are the binding visual decisions the build must honor.

## Layout
- Desktop, asymmetric two-column grid inside a centered browser chrome. Roughly **43% / 57%** left-to-right split at the top; full-width below.
- Left column (hero copy): huge serif headline, italic Spanish subhead, then the CTA button. Large vertical whitespace above and below the CTA.
- Right column (the demo): a stylized olive-gold waveform anchored to the top, a tail descending into a rounded **call-transcript card** with Clario/Usuario dialogue in Spanish, a mic badge top-left of the card, and a faint progress bar at the bottom. Play icon bottom-right.
- Below the demo card (right column continuing downward), three **stacked recommendation cards** in a single vertical column: RESERVATIONS → REVIEWS → SOCIAL. Left column stays blank next to these — deliberate negative space.
- Logo strip: horizontal rule separator, caveat line centered above, five monochrome brand marks evenly spaced.
- Footer: centered dot-separated text links on a cream band that matches the page.

## Type hierarchy
- **Headline:** transitional serif, very heavy weight, tight leading (~0.95). Reads like Playfair Display Black or a custom Domaine-style serif. Four lines, left-aligned. "Five minutes on the phone." / "Three AI tools that fit your restaurant."
- **Subhead:** italic serif, same family, medium weight, ~40% of headline size, color: ink-black at ~85% opacity. Spanish translation, two lines.
- **Body / transcript:** clean geometric sans (Inter-style), 14–15px. CLARIO and USUARIO labels bold in same sans.
- **Card label:** uppercase sans, tracked-out, heavy weight, ~13px. Ink-black.
- **Card body:** regular sans, ink-black, ~14px.
- **Footer:** sans, regular, small, ink-black, dots as separators.

## Palette (hex guesses)
- Background cream: **#F8F2E6** (very close to #FAF5EC I prompted; slight warm shift)
- Ink-black type: **#1E1A14**
- Olive-gold accent (waveform, mic badge, card icons, card borders): **#A28A43** (muted, warm, not yellow)
- Terracotta CTA: **#C05A3E** (burnt, slightly desaturated — NOT tomato, NOT coral)
- CTA label: cream (same as background) on terracotta
- Card fill: **#FBF7EB** (slightly lighter than page background) with **1px olive-gold** border
- Card icon circle: filled olive-gold with cream glyph

## Composition anchor
**The olive-gold waveform + speech-bubble transcript is the single visual element carrying the page.** Everything else is deliberately quiet so the demo commands the eye. Build accordingly: the Remotion Player goes in this spot and replicates the waveform + transcript animation. Do not put anything more visually assertive anywhere else on the page.

## Copy in the mockup (use verbatim where it beats CMO)
- **Headline (use as-is):** "Five minutes on the phone." / "Three AI tools that fit your restaurant."
- **Spanish subhead (use as-is, italic):** "Cinco minutos al teléfono. Tres herramientas de IA que se adaptan a tu restaurante."
- **Transcript seed copy (use for the Remotion demo):**
  - CLARIO: "Hola, ¿en qué puedo ayudarte hoy?"
  - USUARIO: "Tengo un restaurante familiar en Sevilla. Necesito ayuda para gestionar mejor mis reservas y las reseñas en línea. ¡Son demasiadas cosas!"
  - CLARIO: "Entendido. Con solo cinco minutos, puedo identificar las herramientas de IA que se adaptan a tus necesidades específicas. Hablemos sobre tu volumen actual…"
- **Card labels / body:** RESERVATIONS / REVIEWS / SOCIAL with the AI tool lists as shown (OpenTable/Resy/SevenRooms, ReviewTrackers/Birdeye/Reputation, Canva/Buffer/Later). Use verbatim.
- **Logo strip caveat:** "Not affiliated. Tools Clario may recommend."
- **Footer links:** About Clario · Our Mission · Contact · Privacy Policy

## CTA label fix (mockup had placeholder "Call-accent-action")
Replace with: **"Get my call back"** (from cmo_angle.md, per Rule #3 — mockup placeholder, CMO copy wins).

## What the build must NOT do
- Do not invent a second section below the three cards. The cards flow straight into the logo strip.
- Do not replace the terracotta with a tech-blue or a gradient. It's the single accent color; it's the CTA; it's precious.
- Do not render real product logos as `<text>` inside `<svg>`. Use SimpleIcons SVG paths for OpenTable, Square, Canva, WhatsApp, Google. If any of those five isn't on SimpleIcons, drop it and replace with one that is.
- Do not animate anything other than the waveform + transcript + card reveals.
- Do not use a stock-photo hero image. There is no photo on this page.

## Swap log (Rule #3)
- CTA button label: CMO wins (`Get my call back` replaces mockup placeholder).
- Bilingual headline structure: **mockup wins** (English primary + Spanish italic subhead). CMO originally specified single-language. Logged here per rule.
- Specific transcript dialogue: **mockup wins** (more concrete than CMO's placeholder).
