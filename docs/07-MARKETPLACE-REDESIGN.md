# Marketplace redesign: research and visual architecture

## Research method and limits
The live sites (haraj.sa, som.sa, dubizzle.sa) could not be loaded from the build environment
(DNS blocked by the sandbox network policy). Findings below combine secondary sources (linked)
with long-standing, publicly documented classifieds patterns. Each pattern is marked with its
basis. Nothing is copied: no logos, colors or layouts.

| Pattern | Seen in | Basis | How SWAP applies it |
|---|---|---|---|
| Listings start in the first viewport, with no marketing hero | Haraj, OLX/Dubizzle, FB Marketplace | Common classifieds practice. The OLX app case study criticizes a "dull, generic home" and recommends showing recent listings by popular category | The home page has a ~110px discovery strip, then *Latest listings* immediately |
| A persistent row of category icons under the header | FB Marketplace ("scrollable row of rounded category icons"), Haraj tabs | TechCrunch 2017; app usage | Sticky category bar with 10 hardware categories plus "كل الأقسام" |
| Location as a first-class control next to search | OLX/Dubizzle, FB Marketplace | OLX case study (location drives the home experience). FB filters by location and price | City selector in the header. It is remembered per device and injected into searches |
| A big search with suggestions | eBay, Dubizzle | Standard | The header search is the widest element, with live listing and category suggestions |
| Separate main categories from subcategories, avoiding one long list | Classifieds community feedback | HivePress community thread | Drawer and sidebar use collapsible parent→child trees |
| Filter by location and price, with or without a keyword | FB Marketplace | TechCrunch 2017 | Price, city and spec filters work independently of `q` |
| Grid for browsing, list for dense scanning | Haraj (dense list), FB (grid) | Sharetribe docs on grid vs. sidebar layouts | One card component with `grid` and `list` variants, plus a toggle on browse |
| Clear card separation and contrast | OLX case study (low contrast and tight spacing hurt accessibility) | Case study | Cards have a 1px border on a `surface` background over the `background` canvas, and 12px gaps at minimum |
| Seller identity next to the item | FB Marketplace (name, photo, general location) | Pocket-lint guide | The seller card sits right below the price and CTAs |
| A persistent "Post ad" button | Haraj, Dubizzle | Standard | Primary "أضف إعلان" in the header, and the center tab of the mobile bottom bar |
| A full navigation drawer behind a menu button | Mobile classifieds apps | Standard | A grouped drawer (Marketplace, My account, Trust and support, Platform) |

Sources: [TechCrunch on FB Marketplace](https://techcrunch.com/2017/05/01/facebook-gives-its-marketplace-a-colorful-redesign),
[OLX UX case study](https://bootcamp.uxdesign.cc/olxs-ux-a-case-study-7c016217924a),
[OLX product page case study](https://uxplanet.org/designing-a-new-product-page-6c747da4a071),
[HivePress category UX thread](https://community.hivepress.io/t/improve-the-category-and-filtering-ux/4200),
[Sharetribe search layouts](https://www.sharetribe.com/help/en/articles/8425120-search-page-layout-options),
[Paste on FB Marketplace](https://pastemagazine.com/tech/facebook/we-dont-need-facebook-marketplace-but-heres-how-fa).

## Layout architecture
```
┌ Main header (64px, sticky) ──────────────────────────────────────────────────┐
│ ☰  SWAP   [ 📍 المدينة ▾ | 🔍 ابحث عن كرت شاشة، لابتوب…          [بحث] ]   ♡ 💬 🔔 👤 [+ أضف إعلان] │
├ Category bar (44px, sticky with header, desktop) ─────────────────────────────┤
│ ▦ كل الأقسام ▾ │ تجميعات PC · لابتوبات · كروت شاشة · معالجات · … │ ⇄ البدل · ✓ الموثّقة │
└───────────────────────────────────────────────────────────────────────────────┘
Mobile: ☰ SWAP … 🔍 ♡ 👤 / full-width search row / scrollable category chips / bottom tab bar
```
- **Width:** content uses `max-w-[1440px]` with 16–32px gutters. Listing grids run 2 / 3 / 4 / 5 / 6 columns
  at 320 / 640 / 1024 / 1280 / 1536px.
- **Home order:** discovery strip (title, city-aware quick chips, stats) → latest → verified → swap →
  categories → compact inspection explainer → compact footer.

## Design tokens (kept, then tightened)
- **Palette:** off-white canvas `#F7F7F5`, white surfaces, graphite text, **emerald `#0E9F6E`** as the single
  brand accent, and **violet** reserved only for swap affordances. Emerald reads as "trusted/OK", which fits
  a trust-led marketplace. It stays distinct from local classifieds brands. Violet makes swap scannable at a
  glance without competing with the accent.
- **Density:** card radius 12px, controls 10px. Card text is 13–14px and price 15–16px bold.
- **Motion:** 150–200ms, and reduced-motion is respected.

## Visual preview mode
- **When it runs:** only when there is **no `DATABASE_URL`** *and* either `SWAP_VISUAL_PREVIEW=1` is set or the
  deployment is the `swap-preview` Vercel project. Any other production deployment without a database fails
  loudly instead of silently serving sample data.
- **Shared components:** preview renders the *same* header, drawer, cards, browse layout and listing page,
  fed by a labeled fixture dataset. Transactional actions are replaced with a disabled-state notice.
