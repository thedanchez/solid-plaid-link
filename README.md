<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=Ecosystem&background=tiles&project=solid-plaid-link" alt="solid-plaid-link">
</p>

[![NPM Version](https://img.shields.io/npm/v/solid-plaid-link.svg?style=for-the-badge)](https://www.npmjs.com/package/solid-plaid-link) [![Build Status](https://img.shields.io/github/actions/workflow/status/thedanchez/solid-plaid-link/ci.yaml?branch=main&logo=github&style=for-the-badge)](https://github.com/thedanchez/solid-plaid-link/actions/workflows/ci.yaml) [![bun](https://img.shields.io/badge/maintained%20with-bun-cc00ff.svg?style=for-the-badge&logo=bun)](https://bun.sh/)

# Solid Plaid Link

Library for integrating with [Plaid Link](https://plaid.com/docs/link/) in your SolidJS applications.

_Note: This is an unofficial Solid fork based on the official [react-plaid-link](https://github.com/plaid/react-plaid-link) library._

### Installation

```bash
npm install solid-js @danchez/solid-plaid-link
pnpm add solid-js @danchez/solid-plaid-link
yarn add solid-js @danchez/solid-plaid-link
bun add solid-js @danchez/solid-plaid-link
```

## Summary

This library exports three things:

```tsx
import { createPlaidLink, PlaidLink, PlaidEmbeddedLink } from "@danchez/solid-plaid-link";
```

### createPlaidLink

The main core of the library -- this hook does all the heavy lifting for `solid-plaid-link`. It is responsibile for dynamically loading the Plaid script and managing the Plaid Link lifecycle for you. It takes care of refreshing the link token used to initialize Plaid Link before it expires (after 4 hours) and destroying the Plaid Link UI when unmounting on your behalf. Use this hook when you want full control over how and when to display the Plaid Link UI.

- _Note: A new Plaid Link instance is created any time the configuration props change._

In order to initialize Plaid Link via this hook, a [link token](https://plaid.com/docs/api/link/#linktokencreate) is required from Plaid. You can fetch the link token from your server via the required `fetchToken` field. Once Link has been initialized, it returns a temporary `publicToken`. This `publicToken` must then be exchanged for a permanent `accessToken` which is used to make product requests.

- _Note: the `publicToken` to `accessToken` exchange should be handled by your API server that fulfills requests for your SPA._

```tsx
import { createEffect, Match, onMount, Switch } from "solid-js";
import { createPlaidLink } from "@danchez/solid-plaid-link";

const ExampleOne = () => {
  const { ready, error, plaidLink } = createPlaidLink(() => ({
    fetchToken: async () => {
      const response = await fetch("https://api.example.com/plaid/link-token");
      const { link_token, expiration } = await response.json();
      return { link_token, expiration };
    },
    onLoad: () => { ... },
    onSuccess: (publicToken, metaData) => { ... },
    onEvent: (eventName, metaData) => { ... },
    onExit: (error, metaData) => { ... },
  }));

  return (
    <Switch>
      <Match when={error()}>{error().message}</Match>
      <Match when={ready()}>
        { /* use <PlaidLink /> if you just need a button :) */ }
        <button onClick={() => { plaidLink().open(); }}>
          Open Plaid Link
        </button>
      </Match>
    </Switch>
  );
};

const ExampleTwo = () => {
  const { ready, error, plaidLink } = createPlaidLink(() => ({
    fetchToken: async () => {
      const response = await fetch("https://api.example.com/plaid/link-token");
      const { link_token, expiration } = await response.json();
      return { link_token, expiration };
    },
    onLoad: () => { ... },
    onSuccess: (publicToken, metaData) => { ... },
    onEvent: (eventName, metaData) => { ... },
    onExit: (error, metaData) => { ... },
  }));

  createEffect(() => {
    if (!ready()) return;
    plaidLink().open();
  });

  createEffect(() => {
    if (!error()) return;
    // handle error
  });

  return (...);
};
```

### PlaidLink / PlaidEmbeddedLink

This library also provides two Solid components as a convenience: `<PlaidLink />` and `<PlaidEmbeddedLink />` .

`<PlaidLink />` is a button which opens the Plaid Link UI on click. If there are any issues downloading Plaid or creating the Plaid Link instance, the button will be disabled. It is built on top of `createPlaidLink` so it accepts all the same configuration fields along with all the `ButtonHTMLAttributes` as props so you are free to customize the button with your own styles. Additionally, you can enrich the `disabled` or `onClick` props with your own logic on top of their underlying default behaviors.

`<PlaidEmbeddedLink />` is a component that renders the embedded version of the Plaid Link UI using a `div` container. It accepts the same Plaid configuration options as `PlaidLink` but it is **not** built on top of `createPlaidLink` as `PlaidLink` is since the underlying `Plaid.createEmbedded` API works a bit differently than the `Plaid.create` API.

One thing to note about the aforementioned Solid components above, specifically with regard to `fetchToken`: in Solid, JSX is a reactively tracked scope and the reactivity system in Solid only tracks **_synchronously_** -- therefore, components cannot receive `async` functions as values. To workaround this, the function passed to `fetchToken` for the Plaid Link JSX components must use promise chaining instead of relying on `async/await` syntax.

```tsx
import { PlaidLink, PlaidEmbeddedLink } from "@danchez/solid-plaid-link";

const ComponentA = () => (
  <PlaidLink
    fetchToken={() => fetch("https://api.example.com/plaid/link-token").then((response) => response.json())}
    onLoad={() => { ... }}
    onLoadError={(error) => { ... }}
    onSuccess={(publicToken, metaData) => { ... }}
    onEvent={(eventName, metaData) => { ... }}
    onExit={(error, metaData) => { ... }}
  >
    Open Plaid
  </PlaidLink>
);

const ComponentB = () => (
  <PlaidEmbeddedLink
    fetchToken={() => fetch("https://api.example.com/plaid/link-token").then((response) => response.json())}
    onLoad={() => { ... }}
    onLoadError={(error) => { ... }}
    onSuccess={(publicToken, metaData) => { ... }}
    onEvent={(eventName, metaData) => { ... }}
    onExit={(error, metaData) => { ... }}
  />
);
```

## Feedback

Feel free to post any issues or suggestions to help improve this library.
