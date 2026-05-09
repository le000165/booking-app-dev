# Booking SaaS Design System

## Layout rules

- Desktop admin uses sidebar + content shell.
- Mobile admin uses bottom navigation + full-screen pages.
- Booking flow uses a narrow content column with a sticky mobile action bar.

## Component rules

- Cards: 8-12px radius, border-first, light shadow only when needed.
- Forms: consistent labels, 8px input radius, clear focus ring, inline validation.
- Modals: centered on desktop, full-screen on mobile.
- Data views: table on desktop, stacked list rows on mobile.

## Booking flow rules

- Steps: Service -> Staff -> Time -> Details -> Confirmation.
- Sticky mobile CTA bar is step-aware and always visible for steps 1-4.
- Service and staff selection use full-width selectable rows.
- Time slots use consistent-sized selectable buttons.

## Admin rules

- Appointments support list/calendar toggles.
- Filters can be opened in full-screen mode on mobile.
- Settings and edit surfaces should work as standalone full-screen pages on small screens.
