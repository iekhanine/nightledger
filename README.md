# NightLedger v0.3.1 — No-Login Frontline Capture

OneTime Labs

This build changes the most important frontline rule:

> **The root NightLedger app never blocks a HOLD behind a login screen.**

## Root `/`

When a bartender opens:

```text
https://nl.onetimelabs.net/
```

NightLedger goes directly to the HOLD button.

There are three possible capture modes behind the scenes:

### 1. Signed-in staff

If a valid Supabase staff session already exists, the HOLD is saved normally with:

```text
created_by = staff user
capture_mode = authenticated
```

### 2. Enrolled no-login device

A manager can enroll a venue phone once from:

```text
/admin -> Devices
```

NightLedger generates a one-time enrollment URL such as:

```text
https://nl.onetimelabs.net/?enroll=<long random device token>
```

Open that once on the bartender's phone.

The phone stores the scoped capture token locally.

After that, even when there is **no user login session**, HOLD writes directly to the venue backend as:

```text
capture_mode = guest_device
capture_device_id = Back Bar iPhone
created_by = NULL
event_at = server timestamp
```

The admin event stream therefore sees:

```text
10:32:18 PM
LOGGED HOLD
Back Bar iPhone
Needs Review
```

No employee login was required.

The device token:

- is scoped to one venue;
- can create/update its own capture events;
- cannot read venue records;
- cannot open the admin backend;
- cannot read patron/evidence data;
- is stored hashed in PostgreSQL;
- can be disabled later.

### 3. No session and no enrolled device

NightLedger still does **not** show a login screen.

HOLD is timestamped immediately and saved locally on the phone.

This is the emergency fallback so authentication/network/configuration never prevents the user from preserving the timestamp.

Those local-only events are not yet visible on another device's Admin page. The next enhancement can add a reconciliation/sync workflow.

## Admin `/admin`

Admin still requires authentication.

That is intentional.

Frontline capture and management access have different security requirements:

```text
/          → never block HOLD
/admin     → authenticated management
```

## Database

Run the original backend migration first if you have not already:

```text
supabase/001_nightledger_backend.sql
```

Then run:

```text
supabase/002_unlogged_capture.sql
```

Migration 002 adds:

```text
nl_capture_devices
nl_events.capture_device_id
nl_events.capture_mode
nl_events.client_event_at
```

and the guest-device RPCs.

## Device enrollment

After running migration 002:

```text
/admin
  ↓
Devices
  ↓
Device label: Back Bar iPhone
  ↓
Generate enrollment link
```

Open the generated link once on that phone.

After that, the bartender sees only the HOLD workflow whether or not their user login has expired.

## Timestamp behavior

For enrolled devices, NightLedger keeps both:

```text
event_at         = PostgreSQL server clock
client_event_at  = device time when HOLD was completed
```

`event_at` is authoritative.

The phone clock is corroborating metadata only.

## Photos

Authenticated staff can upload photos to the private evidence bucket.

The v0.3.1 no-login device path intentionally guarantees the HOLD and event details first. Device-scoped anonymous photo upload is not enabled yet because private evidence upload needs a separate signed-upload flow rather than opening the Storage bucket to anonymous clients.

## Run

```powershell
cd C:\Projects\VENOPS
npm install
npm run dev
```

Frontline:

```text
http://localhost:5173/
```

Admin:

```text
http://localhost:5173/admin
```

## Deploy

```powershell
npm run build
git add .
git commit -m "Add no-login NightLedger capture devices"
git push
```


## v0.3.1.1 hotfix

The original v0.3.1 package accidentally updated `MobileApp.js` and
`AdminApp.js` to import the new no-login capture functions without
actually adding those exports to `src/lib/api.js`.

That caused Vite to stop at startup with:

```text
The requested module '/src/lib/api.js' does not provide an export named
'guestClassifyEvent'
```

v0.3.1.1 replaces `src/lib/api.js` completely and verifies that every
named import from it has a matching export.

It also completes the Admin → Devices integration that was partially
inserted in v0.3.1.


## v0.3.2 — Signup / confirmation UX

NightLedger now handles both Supabase email-auth modes correctly.

### Recommended during development

Turn **Confirm email OFF** in Supabase.

Then:

```text
Create account
  ↓
automatically signed in
  ↓
Venue Access
```

There is no confirmation email and no second login.

### If confirmation is enabled

Signup now supplies a NightLedger Admin redirect URL. Clicking the email
confirmation returns the browser to `/admin`, where NightLedger completes
the auth callback before checking the session.

A branded confirmation template is included in:

```text
supabase/auth-confirmation-email.html
```

Setup notes:

```text
supabase/AUTH_SETUP.md
```
