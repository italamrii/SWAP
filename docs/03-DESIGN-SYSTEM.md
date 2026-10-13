# SWAP — Design System

## Personality
Calm, technical and trustworthy. Think of a well-made spec sheet rather than a flyer.
There are no busy gradients. Hierarchy comes from type, spacing and one confident accent.

## Color tokens (CSS variables, light / dark)
| Token | Light | Use |
|---|---|---|
| `--background` | `#FAFAF9` warm off-white | page |
| `--surface` | `#FFFFFF` | cards |
| `--foreground` | `#17191C` graphite | text |
| `--muted-foreground` | `#5F6670` | secondary text |
| `--border` | `#E7E5E2` | hairlines |
| `--primary` | `#0E9F6E` → emerald 600 | brand accent: CTAs, links, focus ring |
| `--primary-ink` | `#065F46` | accent text on tinted backgrounds |
| `--verified` | emerald scale | verification (shares the brand: trust *is* the brand) |
| `--swap` | `#7C5CFF` violet | swap affordances only, so swaps are recognizable at a glance |
| `--warning` | amber | unverified notices and caution |
| `--danger` | red | destructive actions |

Emerald was chosen because it reads as "verified/OK" universally and as tech-friendly, and it
stays distinct from Haraj's colors and from generic SaaS blue.

## Typography
- **IBM Plex Sans Arabic** (400/500/600/700) for Arabic and Latin. It has strong
  technical Latin glyphs, so model numbers like "RTX 4070 Ti" sit naturally inside Arabic text.
- Numerals: Western digits (0-9) for prices and specs, which is the norm in the Saudi tech scene.
  Model names and specs are wrapped in `dir="ltr"` spans to keep "16GB DDR5" intact.
- Scale: 12 / 13 / 14 / 16 / 18 / 22 / 28 / 36 / 48 with tight leading on headings.

## Shape & depth
- Radius: 10px for inputs and buttons, 16px for cards, 24px for hero panels.
- Shadows: two levels only (`shadow-xs` hairline and `shadow-card` soft lift on hover).

## Components
Button (primary, secondary, outline, ghost, swap, destructive; sizes sm, md, lg, icon) · Input ·
Textarea · Select · Checkbox · Switch · RadioCards · Badge (neutral, verified, swap, warning,
outline) · Card · Dialog · Sheet (filters on mobile) · DropdownMenu · Tabs · Tooltip ·
Skeleton · EmptyState · Toast (Sonner) · Avatar · Separator · Pagination.

Domain components: `ListingCard`, `VerificationBadge`, `SpecTable`, `InspectionReportView`,
`PriceTag`, `SwapPill`, `SellerCard`, `FilterPanel`, `ImageGallery`, `OfferCard`,
`ChatWindow`, `CategoryTile`.

## Patterns
- **Listing card:** 4:3 image with a verification chip top-start and a favorite button top-end,
  then title (2 lines), key specs line (`RTX 4070 · 12GB · بدون تعدين`), price, city and time ago,
  and swap/negotiable pills.
- **Trust:** a verification panel on the listing page always shows the level, source,
  date and disclaimer. Unverified listings show a soft amber tip, not a scary banner.
- **Mobile:** a sticky bottom action bar on listing pages (price + راسل + بدل) and
  filters in a bottom sheet.
- **Motion:** 150–200ms ease-out on hover lift, sheet slide and toast. `prefers-reduced-motion` is respected.
