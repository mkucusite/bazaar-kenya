# Workflow, speed and navigation repair

## Goal
Make every directory page stay in its correct context, eliminate page flicker, speed up the highest-traffic data paths, complete event workflows, and make the requested image logo and full site offering easy to find on desktop and mobile.

## Implementation

### 1. Correct every directory workflow
- Trace the route kind from list page → card → detail page → booking/contact/publish action and make it the single source of truth.
- Strictly scope directory queries, related listings, labels, breadcrumbs and CTAs to the active kind so Tours never show spa actions, Vehicles never show doctor actions, and Salons never show massage actions.
- Correct malformed legacy links at render time and add safe fallbacks for records whose stored kind is incomplete.
- Verify Tours, Vehicles, Salons, Wellness, Hotels, Doctors, Restaurants and the remaining directory types end to end.

### 2. Remove flicker and improve perceived speed
- Replace full-page loading swaps with stable skeletons that match final dimensions.
- Simplify the global reveal observer so it does not repeatedly scan the whole document or animate large page containers after route changes.
- Keep smooth section/card reveals, but prevent first-screen flashes, layout shifts and double-opening effects.
- Deduplicate homepage requests where possible, keep image dimensions stable, use optimized lazy images below the fold, and prefetch only useful routes.

### 3. Speed up database access
- Reduce oversized `select(*)` requests on busy public pages and prevent unnecessary exact-count/full-table work.
- Add targeted indexes for the proven slow filters and sort orders on ads: active/latest, active/popular, active/category/updated, active/badge/latest and visible-status combinations.
- Recheck the slow-query report after the indexes and query-shape fixes.
- Add a lightweight external six-hour health request. This is a best-effort free-tier safeguard; an internal database cron is not a reliable guarantee against inactivity pausing, while a paid backend is the only guaranteed always-on option.

### 4. Finish events and booking behavior
- Keep event date, start time, end time, location, capacity and ticket fields in publishing/editing.
- Show clear upcoming, live and ended states with a countdown on event detail cards and homepage event promotion.
- Keep new published events automatically eligible for the homepage rail.
- Confirm tour booking opens the enquiry form and sends the request through the listing’s available email/WhatsApp contact instead of navigating incorrectly.

### 5. Restore the preferred logo and complete navigation
- Reuse the image logo already shown on the sign-in screen as a small, crisp header/sidebar mark with a readable wordmark.
- Centralize navigation data so desktop mega menus and the mobile sidebar stay synchronized.
- Add direct mobile access to Doctors, Developers, Wellness, Jobs, Hotels, Tours, Restaurants, Salons, Schools, Gyms, Artisans and Event Services, plus the key trust/legal pages.
- Preserve context-aware header actions such as “List tour”, “List vehicle”, “List salon” and “Host event”.

## Verification
- Test desktop and mobile routes for each directory family, publishing redirects, booking dialogs, event countdowns, search, logo rendering and mobile navigation.
- Compare before/after request timings, inspect console/network errors and rerun the database slow-query report.
- Confirm the production build is clean and no open roadmap items remain.

## Technical notes
- Frontend: React Router, React Query, stable loading shells, scoped IntersectionObserver and shared navigation configuration.
- Backend: focused composite/partial indexes only after frontend query corrections are confirmed; no table redesign or data deletion.
- Availability: the six-hour request can reduce free-tier idle pauses but cannot provide the same guarantee as an always-on paid plan.
