# Architecture

This project is a web-first, mobile-friendly booking SaaS inspired by Square Appointments and BellaBiz.

The app is not a single-salon booking site. It is a multi-tenant SaaS where different businesses can sign up, manage their own services, staff, appointments, and customer booking pages.

## Product Goal

Build a clean, professional appointment booking platform for service businesses.

Primary users:

- Business owner / admin
- Staff / employee
- Customer booking online

The UI should feel modern, clean, spacious, and web-first while still working well on mobile.

## Tech Stack

- Next.js
- React
- TypeScript
- Supabase
- Supabase Auth
- Supabase Postgres
- Supabase RLS
- Tailwind CSS
- Vercel
- Resend for transactional emails

## Main App Areas

### Public Marketing / Landing

Used for visitors before signing up.

Expected pages:

- Landing page
- Pricing page
- Login page
- Signup page

### Admin Dashboard

Used by business owners and admins.

Main areas:

- Overview
- Appointments
- Calendar view
- Services
- Staff management
- Availability / business hours
- Appointment settings
- Booking link / public booking page setup

Admin dashboard must feel like a real SaaS product, not a demo page.

### Customer Booking Page

Public booking page for each business.

Expected route pattern:

```txt
/[slug]/book
```
