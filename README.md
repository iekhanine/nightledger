# NightLedger Mobile v2

## Frontline UX

This build intentionally removes almost everything from the bartender's screen.

### Screen 1

One control:

**HOLD**

A normal tap does nothing.

The bartender must deliberately hold for 700 ms. Moving the finger more than 24 px cancels the gesture.

### What gets timestamped

The deliberate completed hold creates the event timestamp:

- `event_at`

The app opening itself is still silently recorded as a launch for future accidental-open auditing, but a launch never becomes an incident.

The user never has to look at or manage that launch record during an incident.

### Screen 2

Once the hold completes, NightLedger stays on the event screen.

It shows:

- the event time;
- ADD PHOTO;
- any attached photos;
- DONE.

That is all.

The event survives browser/PWA reloads because it is persisted locally as `activeEvent`.

### Photos

ADD PHOTO uses:

```html
<input type="file" accept="image/*" multiple>
```

There is intentionally no `capture="environment"` attribute.

That lets the phone offer its normal photo-picker choices, so staff can:

- take a photo from NightLedger when safe; or
- attach a photo they already took using the phone's normal camera app.

Every photo is linked to the original `event_at` timestamp.

The prototype also stores `attached_at` metadata for later audit/review.

### Done

DONE closes the quick event and shows a short SAVED confirmation.

The future manager web application is where staff can later add:

- incident type;
- narrative;
- patron identity clues;
- payment-tab name;
- bans;
- police / EMS references;
- CCTV;
- corrective action.

## Run

```powershell
npm install
npm run dev
```

## Build

```powershell
npm run build
```

## Production next step

The mobile app should write the same minimalist flow into Supabase:

- `nl_app_launches`
- `nl_events`
- `nl_event_photos`

Do not put the larger incident form back into this frontline mobile screen.
