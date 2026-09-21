# LUMEN (لومن) - Design System Specification
Template #5 · Picksaw Studio Clinic Collection

## 1. Brand Identity & Personality
- **Brand Name (FA):** لومن
- **Brand Name (EN):** LUMEN
- **Tagline:** «جزئیات، تفاوت را می‌سازند.»
- **Personality:** Contemporary, refined, confident, warm, intelligent, professional, premium.
- **RTL Context:** Natural modern Persian, right-to-left layout with optical balance for bidirectional typography and numerals.

## 2. Color Direction & Tokens
| Token | Hex Code | Usage Role |
| :--- | :--- | :--- |
| **Deep Plum** | `#332635` | Dominant brand anchor, dark sections, high-contrast typography, hero emphasis |
| **Muted Mauve** | `#9B7B8D` | Secondary text, subtle border tones, muted badges, architectural lines |
| **Soft Linen** | `#ECE2D8` | Dominant warm canvas, intentionally distinct from white |
| **Linen Surface** | `#E3D6D0` | Alternating editorial sections and quiet inset areas |
| **Rose Wash** | `#E7D8DD` | Elevated cards, drawers, modal frames, and light CTAs |
| **Mauve Wash** | `#DED5DD` | Nested utility surfaces, filter pills, and compact panels |
| **Soft Rose** | `#D8B6BE` | Refined accent, interactive highlights, CTA secondary borders, focal glows |
| **Charcoal** | `#242126` | Deep neutral for crisp body typography and contrast |
| **Warm Gray** | `#777176` | Editorial body copy, metadata, secondary captions |
| **Plum Dark** | `#271C2A` | Deep contrast section containers |

## 3. Anti-Slop Discipline & Taste Skill Principles
- **No Em-Dash Ban:** Strictly 0 em-dashes (em-dash banned). Use standard hyphens (`-`), colons, or Persian punctuation.
- **No Generic Cards:** Services displayed as an editorial interactive index / progressive split accordion, not 3 generic boxes.
- **No Decorative Blobs or Gradients:** Restrained solid tones with organic micro-textures and precise 1px borders.
- **No Fake Elements:** Absolutely NO fake testimonials, NO fake reviews, NO fake statistics, NO booking/pricing/contact forms, NO iframe maps.
- **Dominance Balance:** Deep plum pairs with layered linen, rose-wash, and mauve-wash surfaces; soft rose remains a restrained accent.

## 4. Typography Scale & Font Stack
- **Persian Font:** `Vazirmatn`, 'Segoe UI', system-ui, -apple-system, sans-serif
- **Latin Display Font:** `Cinzel`, `Outfit`, 'Cormorant Garamond', Georgia, serif
- **Scale:**
  - Hero Headline: `text-4xl sm:text-5xl md:text-6xl lg:text-7xl` (`leading-[1.15] font-light tracking-tight`)
  - Section Headings: `text-2xl sm:text-3xl md:text-4xl` (`font-light tracking-tight`)
  - Sub-headings & Philosophy: `text-xl sm:text-2xl` (`font-normal leading-relaxed`)
  - Body Text: `text-sm sm:text-base` (`leading-relaxed font-normal text-warmGray`)
  - Micro-Labels & Badges: `text-xs uppercase tracking-widest font-medium`

## 5. Spacing Rhythm & Layout Variance
- **Grid:** 8pt modular rhythm (`py-16 md:py-24 lg:py-32`)
- **Compositional Variety:**
  - Hero: Asymmetric Editorial Split with floating detail anchor
  - Intro: Pure Typography Split (whitespace driven, zero cards)
  - Services: Editorial Interactive List with touch & keyboard disclosure
  - Feature: Monumental Image Showcase with refined offset caption
  - Philosophy: Sequential scroll-activated conceptual rhythm
  - Gallery: Multi-aspect editorial masonry with restrained captions
  - Process: Progressive linear milestone path
  - Contact: High-clarity utility hub with external maps (Balad, Neshan, Google)

## 6. Components & Interaction Rules
- **Sticky Navbar:** Blended transparent at top, transforming to translucent Warm Ivory / Deep Plum with blur on scroll.
- **Floating Contact Dock:** Fixed bottom-right on desktop, full-width docked at bottom on mobile. Only 3 direct channels: Instagram, Phone, WhatsApp.
- **Buttons:** Subtle rounded pills (`rounded-full`) or clean refined boxes (`rounded-xl`), 1px borders in Muted Mauve or Soft Rose, distinct focus rings, no wrapping.
- **Motion:** Restrained GSAP with ScrollTrigger and Lenis smooth scroll. Deliberate, smooth reveals without jarring zooms or particles.
