# CLAUDE.md

## Product

Multi-tenant booking SaaS inspired by:

- Square Appointments
- BellaBiz

Primary usage:

- desktop/browser first
- mobile responsive secondary

---

## Important Project Context

- This is NOT a mobile-first app
- Prioritize desktop operational UX
- Avoid oversized mobile-style cards on desktop
- Use horizontal space efficiently

---

## Supabase Rules

Always respect:

- business_id isolation
- RLS compatibility

Never hard delete staff with appointment history.

Inactive staff:

- hidden from booking flow
- excluded from "Any available"
- preserved historically

---

## Booking Status Enum

Allowed values ONLY:

- confirmed
- completed
- cancelled
- no_show

Never use:

- no-show
- canceled
- done

---

## Existing Architecture Notes

Business hours and employee schedules are separate systems.

Appointment duration:

- dynamic per service
- supports multi-service total duration

Timezone handling:

- Supabase stores UTC
- frontend displays local timezone

---

## UI Direction

Inspired by:

- Square
- BellaBiz
- Linear
- Stripe Dashboard

Avoid:

- nested cards
- excessive padding
- wasted whitespace
- mobile layouts stretched onto desktop

---

## Current Priorities

- UI consistency
- production polish
- calendar UX
- responsive dashboard refinement
- Stripe integration
