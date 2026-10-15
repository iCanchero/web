# iCanchero Web

## iCanchero web account

The web app supports existing users who sign in with an email or username. They
can view basic read-only account information, recover a password, and request
account deletion through the public `/delete-account` resource. User-facing
account copy is Spanish. The web app does not provision users or provide
signup, social providers, onboarding, email verification, or profile editing.

`/delete-account` is the intended external account-deletion URL for Google Play
Console. Production deployment, Play Console configuration, privacy-policy
review, and destructive acceptance with a purpose-created disposable account
remain manual release actions; automated tests do not send email or delete a
live account.

### Local setup

Copy `.env.example` to an environment file owned by your local setup and fill
these public client variables:

- `ICAN_FIREBASE_API_KEY`
- `ICAN_FIREBASE_PROJECT_ID`
- `ICAN_FIREBASE_APP_ID`
- `ICAN_API_URL`
- `ICAN_SITE_URL` (for example, `https://app-dev.icanchero.com` on Preview)

Run the focused development and verification commands from this directory:

```bash
npm ci
npm run dev
npm test
npm run typecheck
npm run build
```

Firebase is initialized lazily in the browser. Unit tests mock Firebase,
network requests, and email delivery; live Firebase/backend acceptance remains
a manual environment check.

# Getting Started

To run this application:

```bash
npm ci
npm run dev
```

# Building For Production

To build this application for production:

```bash
npm run build
```

Use Node.js 22.12 or newer. For a local production server:

```bash
npm start
```

### TanStack Start stable baseline

This app uses TanStack Start 1.169.2 or newer (1.169 is the first stable
release), Vite 8, and the `nitro/vite` adapter. TanStack packages use explicit
version ranges rather than `latest`; commit lockfile updates with dependency
changes. Both `package-lock.json` and `bun.lock` are tracked, so keep both in sync
when changing dependencies. The commands here use npm and its lockfile.

The RC migration does not require an authentication rewrite: Firebase auth is
initialized in the browser and the Players API remains the authorization
boundary. This app does not use Start's removed `useSession` or
`.inputValidator()` APIs, or a custom server entry. Its association endpoints
return explicit `Response` objects, preserving their status, JSON, and cache
headers under the stable response rules.

Migration reference: [TanStack RC migration guide](https://tanstack.com/start/latest/docs/framework/react/migrate-from-release-candidate).

## Vercel Deployment

This app is deployed with Vercel from GitHub.

### Branch and domain mapping

- Production branch: `main`
- Production domain: `app.icanchero.com`
- Preview branch: `dev`
- Preview domain: `app-dev.icanchero.com`

### Important behavior

- A Preview custom domain shows `No Deployment` until the mapped branch has at least one successful Vercel Preview deployment.
- To trigger it, push any commit to the preview branch (`dev`).
- If no preview deploy appears, verify Vercel `Settings -> Git -> Preview Deployments` is enabled.

### Runtime environment variables

Define these in Vercel Project Settings for both Production and Preview as needed:

- `APPLE_TEAM_ID`
- `IOS_BUNDLE_ID`
- `IOS_APP_ID`
- `ANDROID_PACKAGE_NAME`
- `ANDROID_SHA256_FINGERPRINTS`
- `ICAN_SITE_URL` (`https://app.icanchero.com` in Production and
  `https://app-dev.icanchero.com` in Preview)

Notes:

- These association variables are read by the server at request time. Vite's
  build-time `.env.production` loading does not configure a deployed Node process.
- Set the variables in the hosting project's Production/Preview environment and
  deploy again for the running server to receive them.

## Deep Link Verification Files

The public, unauthenticated GET routes are:

- `/.well-known/apple-app-site-association`
- `/.well-known/assetlinks.json`

Both return JSON with a five-minute cache when configured. Invalid or missing
configuration returns HTTP 503 with `Cache-Control: no-store`, rather than a
successful response containing an unusable association.

Production runtime settings for `app.icanchero.com`:

```dotenv
APPLE_TEAM_ID=3V782SQX2A
IOS_BUNDLE_ID=com.icanchero.app
IOS_APP_ID=3V782SQX2A.com.icanchero.app
ANDROID_PACKAGE_NAME=com.icanchero.app
ANDROID_SHA256_FINGERPRINTS=38:AC:21:75:88:9C:4D:C0:20:72:69:43:DF:CF:EF:6B:A8:DC:AD:2D:2B:B5:FF:AB:B8:50:B9:C6:5F:DB:58:D1
```

The Apple team ID was confirmed against the saved EAS production credentials.
The Android SHA-256 was read from the default EAS credentials for
`icanchero` / `com.icanchero.app` on 2026-09-05. It covers APKs signed with that
keystore. For Play Store distribution, append the **Play app signing certificate**
SHA-256 from Play Console's App integrity page, separated by a comma. Firebase's
registered fingerprints are used for Firebase/Google services; the SHA-1 values
in `google-services.json` are not valid SHA-256 website associations.

`IOS_APP_ID` is an optional full `application-identifier` override. Otherwise the
route composes `APPLE_TEAM_ID.IOS_BUNDLE_ID`. If Apple's App ID prefix differs
from the team ID, use the prefix in `IOS_APP_ID`. If both `IOS_APP_ID` and
`IOS_BUNDLE_ID` are supplied, their bundle identifiers must match.

For `app-dev.icanchero.com`, configure the `.dev` bundle/package and its own
signing fingerprint. Do not reuse the production Android fingerprint without
checking the development signing certificate.

Before installing a new native build, verify both production GET endpoints
return HTTP 200 and the JSON above, without a redirect or authentication page.
The app must also contain `applinks:app.icanchero.com` on iOS and the matching
verified HTTPS intent filter on Android. Apple caches associations through its
CDN, so website changes may not immediately reach an already-installed app.

```bash
curl -i https://app.icanchero.com/.well-known/apple-app-site-association
curl -i https://app.icanchero.com/.well-known/assetlinks.json
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

### Removing Tailwind CSS

If you prefer not to use Tailwind CSS:

1. Remove the demo pages in `src/routes/demo/`
2. Replace the Tailwind import in `src/styles.css` with your own styles
3. Remove `tailwindcss()` from the plugins array in `vite.config.ts`
4. Remove `@tailwindcss/vite` and `tailwindcss` from `package.json`

## Linting & Formatting

This project uses [eslint](https://eslint.org/) and [prettier](https://prettier.io/) for linting and formatting. Eslint is configured using [tanstack/eslint-config](https://tanstack.com/config/latest/docs/eslint). The following scripts are available:

```bash
npm run lint
npm run format
npm run check
```

## Shadcn

Add components using the latest version of [Shadcn](https://ui.shadcn.com/).

```bash
npx shadcn@latest add button
```

## Deploy with Nitro

This project uses Nitro as a generic server adapter, so it can run on any Node-compatible host.

```bash
npm run build
npm start
```

The default Node build emits `.output/server/index.mjs` and client assets in
`.output/public/`. Deploy the complete `.output/` directory to a Node host and
run `node .output/server/index.mjs`. Nitro detects Vercel during a Vercel build
and emits the provider-specific output instead; `npm start` is for the default
local Node build.

For host-specific presets (Vercel, Netlify, Cloudflare, AWS Lambda, etc.) and tuning, see https://v3.nitro.build/deploy.

## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from '@tanstack/react-router'
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you render `{children}` in the `shellComponent`.

Here is an example layout that includes a header:

```tsx
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'My App' },
    ],
  }),
  shellComponent: ({ children }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
          </nav>
        </header>
        {children}
        <Scripts />
      </body>
    </html>
  ),
})
```

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Server Functions

TanStack Start provides server functions that allow you to write server-side code that seamlessly integrates with your client components.

```tsx
import { createServerFn } from '@tanstack/react-start'

const getServerTime = createServerFn({
  method: 'GET',
}).handler(async () => {
  return new Date().toISOString()
})

// Use in a component
function MyComponent() {
  const [time, setTime] = useState('')

  useEffect(() => {
    getServerTime().then(setTime)
  }, [])

  return <div>Server time: {time}</div>
}
```

## API Routes

You can create API routes by using the `server` property in your route definitions:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: () => Response.json({ message: 'Hello, World!' }),
    },
  },
})
```

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/people')({
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json()
  },
  component: PeopleComponent,
})

function PeopleComponent() {
  const data = Route.useLoaderData()
  return (
    <ul>
      {data.results.map((person) => (
        <li key={person.name}>{person.name}</li>
      ))}
    </ul>
  )
}
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

For TanStack Start specific documentation, visit [TanStack Start](https://tanstack.com/start).
