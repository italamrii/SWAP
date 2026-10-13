# سواب · SWAP — Product Brief

> **بيع. بدّل. وثّق.** — Sell. Swap. Verify.

## The problem
Saudi gamers, PC builders and laptop owners trade used hardware on general classifieds
(Haraj, X/Twitter, WhatsApp groups). Those channels are noisy and unstructured:

- Listings say "كرت شاشة نظيف" with no VRAM, no mining history, no temperatures.
- Buyers cannot compare like-for-like because specs are free text.
- Trust is the bottleneck: a used GPU or laptop can hide a degraded battery,
  a dying SSD or thermal problems, and nothing on the listing proves otherwise.
- Swapping (بدل), which is very common in the local PC scene, happens in messy DMs
  with no record of what was proposed.

## The product
A C2C marketplace only for computer hardware. SWAP does not hold inventory; it connects
buyers and sellers and gives them better tools than a generic classifieds site:

1. **Structured listings by category.** Each category has its own spec schema
   (a GPU has VRAM, mining history and box status; a laptop has battery health and refresh rate).
   Specs power both the listing page and the filters.
2. **Swap as a first-class workflow.** Sellers mark a listing as open to swaps. Buyers send
   a structured swap offer: what they offer, its condition, and a cash difference in either
   direction. Sellers accept or reject it, and the whole exchange stays in the chat thread.
3. **Optional inspection reports.** Sellers can attach a technical report (a manual form
   plus evidence, and later an output from the SWAP desktop inspection agent or a partner
   store). Reports are reviewed and shown as a verification level, never as a guarantee.
4. **Private negotiation.** Built-in chat with offer context. Phone numbers stay hidden
   unless the seller chooses to show them.

## Audience (Saudi first)
Gamers · PC builders · students · laptop upgraders · tech enthusiasts. The app is
Arabic-first (RTL), with English supported in the data model and copy structure, and
prices in SAR.

## Positioning vs. generic classifieds
| | Generic classifieds | SWAP |
|---|---|---|
| Scope | Everything | Hardware only |
| Specs | Free text | Category schemas, filterable |
| Swaps | DMs | Structured offers with cash difference |
| Trust | Seller reputation | Inspection reports + verification levels + reputation |
| Privacy | Phone number on listing | In-app chat, phone optional |

## Verification levels (never overclaim)
| Level | Arabic | Meaning |
|---|---|---|
| `unverified` | بدون تقرير | No report attached. |
| `seller_report` | تقرير البائع | The seller submitted specs and evidence, and a moderator checked that the report is complete and consistent. |
| `platform_checked` | فحص المنصة | The report came from the SWAP inspection tool, with machine-collected data and a matching checksum. |
| `partner_verified` | فحص شريك معتمد | A partner store physically inspected the device. |

Every report carries the disclaimer: *يعكس التقرير حالة الجهاز وقت الفحص ولا يُعد ضمانًا مطلقًا.*

## MVP success metrics
- % of active listings with structured specs filled ≥ 80%
- % of listings with an inspection report (target 15% at launch)
- Median first response time in chat
- Swap offers sent per swap-enabled listing
- Reports of abuse per 1,000 listings (lower is better)

## Out of scope for the MVP (designed for, not built)
Payments/escrow, shipping integration, the native desktop inspection agent binary,
SMS/OTP login, ratings after a completed deal, and paid promotion/boosts.
