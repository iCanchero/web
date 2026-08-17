# iCanchero Web

## iCanchero web authentication

The web app currently supports existing-account password login with an email
or username, plus the deployed password-recovery flow (email, six-digit code,
and a new password). User-facing authentication copy is Spanish. The web app
does not provision users or provide signup, social providers, onboarding,
email verification, or account deletion yet.

### Local setup

Copy `.env.example` to an environment file owned by your local setup and fill
these public client variables:

- `ICAN_FIREBASE_API_KEY`
- `ICAN_FIREBASE_PROJECT_ID`
- `ICAN_FIREBASE_APP_ID`
- `ICAN_API_URL`

Run the focused development and verification commands from this directory:

```bash
npm install
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
npm install
npm run dev
```

# Building For Production

To build this application for production:

````bash
npm run build

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

Notes:

- Local `.env*` files can keep placeholders only.
- Real deployed values should come from Vercel environment variables.

## Deep Link Verification Files

This project serves platform verification files at:

- `/.well-known/apple-app-site-association`
- `/.well-known/assetlinks.json`

Set these environment variables in your deployment:

- `APPLE_TEAM_ID`: Apple Team ID used to compose iOS app IDs
- `IOS_BUNDLE_ID`: defaults to `com.icanchero.app`
- `IOS_APP_ID`: optional override, e.g. `ABCDE12345.com.icanchero.app`
- `ANDROID_PACKAGE_NAME`: defaults to `com.icanchero.app`
- `ANDROID_SHA256_FINGERPRINTS`: comma-separated SHA256 fingerprints for the deployed app signing certs```

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
````

## Shadcn

Add components using the latest version of [Shadcn](https://ui.shadcn.com/).

```bash
npx shadcn@latest add button
```

## Deploy with Nitro

This project uses Nitro as a generic server adapter, so it can run on any Node-compatible host.

```bash
npm run build
node dist/server/index.mjs
```

The build output is a self-contained Node server. To deploy, push the `dist/` directory to your host (Render, Fly.io, your own VPS, etc.) and run the server command above.

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
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: () => json({ message: 'Hello, World!' }),
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
