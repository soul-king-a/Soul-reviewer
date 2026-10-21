# Local Reviewer

A local reviewer app built with plain HTML, CSS, and JavaScript. It provides
region-themed sign-in and registration for Cameroon, plus a reviewer workspace
with a problem-report form, profile details, network presence, and optional
location lookup.

## Project structure

```text
.
├── index.html
├── 404.html
├── register.html
├── reviewer.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── preferences.js
│   ├── register.js
│   └── reviewer.js
└── README.md
```

## Run locally

Serve this folder from `localhost` (for example, with the VS Code Live Server
extension), then open `index.html`. No package installation or build step is
required. A local server provides the secure browser context needed for Web
Crypto and geolocation.

Create an account from the sign-in page to open the reviewer workspace. This
is a front-end-only demo: account records and sessions stay in the current
browser, passwords are stored as salted PBKDF2 hashes, and there is no server
or real authentication security. Do not use real or reused passwords. Clearing
the browser's local site data removes the local accounts.

Sign-in and registration require browser location permission and an OpenStreetMap
Nominatim reverse lookup that reports country code `cm` and one of Cameroon's
ten regions. The single sign-in page detects a region and applies its color
theme; it does not create separate login pages. Non-Cameroon locations are sent
to the `404.html` lost page. Region matching uses Nominatim's region names or
Cameroon ISO 3166-2 region codes. Coordinates are sent to Nominatim to verify
the country and region. The reviewer profile also offers an on-demand location
lookup and displays the city/country and coordinates without saving them. The
online/offline indicator reflects the browser's network status and does not
guarantee that a specific website is reachable.

This country restriction is only a client-side demo check and can be bypassed.
Enforcing it securely requires server-side authentication and location
verification.

## Reporting a problem

The reviewer workspace has a report form for the issue summary, contact email,
area, priority, expected result, and reproduction steps. Submitting opens the
user's default email application with the report addressed to
`songivan54@gmail.com`; the user must press Send to deliver it. Because there
is no backend or email service, the app cannot send reports automatically.

## Project overview

- `index.html` and `register.html` provide sign-in and account creation.
- `js/auth.js` handles browser-local accounts, authentication, region checks,
  and location lookup.
- `reviewer.html` and `js/reviewer.js` provide the review form, prepare an
  email for the user to send, and let users edit their display name and view
  report history stored in their browser.
- `js/preferences.js` provides the saved light/dark theme toggle and password
  visibility controls used on sign-in and registration.
- The pages load Bootstrap Icons v1.11.3 from jsDelivr for small UI icons;
  an internet connection is required for those icons to appear.
- `css/styles.css` contains the responsive layout, regional color themes, and
  motion/accessibility styles.
- `404.html` is the location-restriction page for users outside Cameroon.

Profile statistics are demonstration content. Display names and a history of
reports prepared for email are stored in the current browser under that
account; they are not shared across browsers or devices. Report history only
means an email was prepared and does not prove it was sent or delivered.

The light/dark preference is saved in this browser and applies across the app.
Password visibility buttons only reveal the current field on screen; they do
not save or change its value.
