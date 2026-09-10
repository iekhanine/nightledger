# NightLedger Mobile

Mobile-first OneTime Labs prototype for rapid incident and patron capture in licensed venues.

## Project structure

```text
NightLedger-Mobile/
├── public/
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── manifest.webmanifest
│   └── sw.js
├── src/
│   ├── main.js
│   └── styles.css
├── .gitignore
├── index.html
├── package.json
├── vercel.json
├── vite.config.js
└── README.md
```

## Run locally

```powershell
npm install
npm run dev
```

## Build

```powershell
npm run build
```

## Deploy

Import the repo into Vercel and assign:

`nightledger.onetimelabs.net`

## Prototype behavior

- Opening the app logs a launch timestamp.
- Opening does not create an incident.
- A deliberate press-and-hold creates the event.
- Finger movement cancels the hold to reduce accidental activations.
- Event actions create individual timestamps.
- Photos can be captured from the phone when safe.
- Post-event identity clues can be added separately from verified identity.
- Recent launch/event data is stored locally in the browser for prototype testing.
