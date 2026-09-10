# NightLedger Auth Setup

## Recommended setting while building

For the current development phase, turn **Confirm email OFF** in the
Supabase project's Email authentication settings.

With confirmation disabled, the NightLedger flow becomes:

```text
Create account
    ↓
Supabase returns a session immediately
    ↓
NightLedger automatically continues
    ↓
Create / join venue
```

No email and no second login.

## If Confirm email is ON

NightLedger v0.3.2 now passes this callback during signup:

```text
<current-origin>/admin?auth=confirmed
```

Examples:

```text
http://localhost:5173/admin?auth=confirmed
https://nl.onetimelabs.net/admin?auth=confirmed
```

Add the applicable NightLedger URLs to the Supabase Auth redirect URL
allow-list.

After the user clicks the confirmation email, Supabase returns them to
`/admin`, NightLedger consumes the authentication callback, and the
existing authenticated session is used automatically.

The user should not have to manually enter their password again.

## NightLedger-branded confirmation email

A ready-to-paste HTML template is included at:

```text
supabase/auth-confirmation-email.html
```

Use it for the Supabase **Confirm signup** email template.

Suggested subject:

```text
Confirm your NightLedger account
```

The template makes the message look like NightLedger, but the visible
sender/from-address is controlled separately by email delivery.

To make the sender itself a NightLedger / OneTime Labs address, configure
custom SMTP for the Supabase project later.

## Development recommendation

Right now:

```text
Confirm email: OFF
```

Later, before production onboarding:

```text
Confirm email: ON
NightLedger email template: configured
Custom SMTP: configured
Redirect URLs: configured
```
