# Design research → decisions

Short notes from reviewing current marketplace and filter UX guidance (Oct 2026), and the
SWAP decision each one led to. These are patterns we took as inspiration. We didn't copy any layout.

| Finding | Source | SWAP decision |
|---|---|---|
| Trust signals (verification, response rate, deal counts) drive decisions only when they sit near the price and CTA. Too many badges reduce credibility. | Rigby marketplace UX guide; Yclas "Trust by design" | The listing page's top-right block holds price, verification level, seller response rate and join date right beside the CTAs. A single verification badge style is used, and there are no stacked trust seals. |
| Keep filters visible on desktop. On mobile use a drawer with a sticky apply button that shows the result count. | Baymard filter UI | Sticky sidebar on `lg+`. Bottom sheet on mobile with "اعرض N إعلان". |
| Show counts next to filter options. Use OR within a filter type and AND across types. | Baymard | Facet counts come from `listing_attributes`. Multi-select within a field is OR, and fields combine with AND. |
| Long option lists → show the top values and "Show more". 44px touch targets. | Wisepim / Baymard benchmark | Each field shows its first 6 options, then «عرض المزيد». Chips are at least 40px tall. |
| A verification photo with a unique code proves the seller has the item. A diagnostics badge is filterable. | Swappa listing verification + Phonecheck | Each inspection gets a one-time **verification code** that the seller writes on paper and photographs next to the device. There's a "موثّق فقط" filter. |
| Avoid overclaiming. Describe what was checked, by whom and when. | General trust-UX guidance | Each verification level states its source, date and checklist, followed by a fixed disclaimer. Reports older than 90 days are flagged as old. |

Sources:
- https://rigbyjs.com/blog/marketplace-ux
- https://yclas.com/blog/trust-by-design-ux-strategies-for-online-marketplaces.html
- https://baymard.com/learn/ecommerce-filter-ui
- https://baymard.com/mcommerce-usability/benchmark/mobile-page-types/filtering-options
- https://wisepim.com/blog/ecommerce-product-filters-ux-best-practices
- https://swappa.com/en/about/verification
- https://www.phonecheck.com/newsroom/swappa-is-live-with-phonecheck
