# Local Reviewer

A local reviewer app, built with plain
HTML, CSS, and JavaScript to distinguish user signin from Cameroon region only.

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
│   ├── register.js
│   └── reviewer.js
└── README.md
```

## Run locally

Serve this folder from `localhost` (for example, with the VS Code Live Server
extension), then open `index.html`. No package installation or build step is
required. A local server provides the secure browser context needed for
Web Crypto.

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
