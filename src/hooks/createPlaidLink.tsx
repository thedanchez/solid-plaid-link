import { createScript } from "solid-create-script";
import { type Accessor, createEffect, createResource, createSignal, onCleanup } from "solid-js";

import { PLAID_LINK_STABLE_URL } from "../constants";
import type { CreatePlaidLinkConfig, PlaidLinkHandler } from "../types";

const NOOP_PLAID_HANDLER: PlaidLinkHandler = {
  open: () => {
    console.warn("solid-plaid-link: Plaid Link is not ready yet. This is a no-op.");
  },
  exit: () => {},
  submit: () => {},
};

/**
 * ## Summary
 *
 * Utility hook that dynamically loads the Plaid script and manages the Plaid Link creation for you. Use this hook when
 * you want full control over how and when to display the Plaid Link UI. Regardless of how this hook is used, it takes
 * care of refreshing the link token before it expires and destroying the Plaid Link UI when unmounting on your behalf.
 *
 * - _Note: A new Plaid Link instance is created any time the configuration props change._
 *
 * In order to initialize Plaid Link via this hook, a [linkToken](https://plaid.com/docs/api/link/#linktokencreate) is
 * required from Plaid. You can fetch the link token from your server via the required `fetchToken` field. Once Link has
 * been initialized, it returns a temporary `publicToken`. This `publicToken` must then be exchanged for a permanent
 * `accessToken` which is used to make product requests.
 *
 * - _Note: the `publicToken` to `accessToken` exchange should be handled by your API server that fulfills requests for
 * your SPA._
 *
 * ## Usage
 * ```tsx
 * import { Switch, Match, onMount } from "solid-js";
 * import { createPlaidLink } from "@danchez/solid-plaid-link";
 *
 * const ExampleOne = () => {
 *  const { ready, error, plaidLink } = createPlaidLink(() => ({
 *    fetchToken: async () => {
 *      const response = await fetch("https://api.example.com/plaid/link-token");
 *      const { link_token, expiration } = await response.json();
 *      return { link_token, expiration };
 *    },
 *    onLoad: () => { ... },
 *    onSuccess: (publicToken, metaData) => { ... },
 *    onEvent: (eventName, metaData) => { ... },
 *    onExit: (error, metaData) => { ... },
 *  }));
 *
 *  return (
 *    <Switch>
 *      <Match when={error()}>{error().message}</Match>
 *      <Match when={ready()}>
 *        <button onClick={() => { plaidLink().open(); }}>
 *          Open Plaid Link
 *        </button>
 *      </Match>
 *    </Switch>
 *  );
 * };
 *
 * const ExampleTwo = () => {
 *  const { ready, error, plaidLink } = createPlaidLink(() => ({
 *    fetchToken: async () => {
 *      const response = await fetch("https://api.example.com/plaid/link-token");
 *      const { link_token, expiration } = await response.json();
 *      return { link_token, expiration };
 *    },
 *    onLoad: () => { ... },
 *    onSuccess: (publicToken, metaData) => { ... },
 *    onEvent: (eventName, metaData) => { ... },
 *    onExit: (error, metaData) => { ... },
 *  }));
 *
 *  createEffect(() => {
 *    if (!ready()) return;
 *    plaidLink().open();
 *  });
 *
 *  createEffect(() => {
 *    if (!error()) return;
 *    // Handle error;
 *  });
 *
 *  return (...);
 * };
 */
const createPlaidLink = (config: Accessor<CreatePlaidLinkConfig>) => {
  const script = createScript(PLAID_LINK_STABLE_URL, {
    defer: true,
  });

  const [tokenRequest, { refetch }] = createResource(config().fetchToken);

  const [plaidLink, setPlaidLink] = createSignal(NOOP_PLAID_HANDLER);
  const [ready, setReady] = createSignal(false);

  const error: Accessor<Error | null> = () => script.error || tokenRequest.error || null;

  createEffect(() => {
    if (script.loading || tokenRequest.loading) return;

    if (script.error || typeof window === "undefined" || !window.Plaid) {
      console.error("solid-plaid-link: Error loading Plaid script.", script.error?.message);
      return;
    }

    if (tokenRequest.error) {
      console.error("solid-plaid-link: Error fetching link token.", tokenRequest.error.message);
      return;
    }

    const link_token = tokenRequest()?.link_token || "";
    const expiration = tokenRequest()?.expiration || "";

    if (!link_token || !expiration) {
      console.error("solid-plaid-link: fetchToken response missing link token or expiration date.");
      return;
    }

    const plaidHandler = window.Plaid.create({
      ...config(),
      token: link_token,
      onLoad: () => {
        setReady(true);
        config().onLoad?.();
      },
    });

    setPlaidLink(plaidHandler);

    const now = Date.now();
    const expirationTime = new Date(expiration).getTime();
    const timeUntilLinkTokenExpires = expirationTime - now;

    // Link Tokens expire after 4 hours. Set a timer to refresh the token 5 minutes before it expires.
    const timerId = setTimeout(refetch, timeUntilLinkTokenExpires - 5 * 60 * 1000);

    onCleanup(() => {
      plaidHandler.exit({ force: true });
      plaidHandler.destroy();

      setPlaidLink(NOOP_PLAID_HANDLER);
      setReady(false);

      clearTimeout(timerId);
    });
  });

  return {
    /** Flag whether Plaid Link has successfully loaded or not */
    ready,
    /** Possible error from either downloading Plaid script from CDN or error fetching link token */
    error,
    /** The Plaid Link client */
    plaidLink,
  } as const;
};

export default createPlaidLink;
