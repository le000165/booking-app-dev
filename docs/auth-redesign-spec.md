# Auth Redesign Spec

## Login Page

Route: `/login`

Purpose:
Dedicated login-only page.

Requirements:

- Full-page professional SaaS layout
- Split-panel layout on desktop
- Mobile responsive
- Keep Admin / Employee role toggle
- Email/password form
- Forgot password link can be stubbed
- Link to `/signup`
- Back to home link
- Use existing `login()` server action
- Do not change auth logic

## Signup Page

Route: `/signup`

Purpose:
Dedicated owner signup page.

Requirements:

- Full-page professional SaaS layout
- Split-panel layout on desktop
- Mobile responsive
- No Admin / Employee role toggle
- Signup always creates owner/admin account
- Link to `/login`
- Back to home link
- Use existing `signup()` server action from `login/actions.ts`
- Do not change database schema
- Do not change Supabase auth behavior

## Do Not Touch

- `src/app/(public)/login/actions.ts`
- Admin dashboard logic
- Booking page `/[slug]/book`
- Supabase schema
