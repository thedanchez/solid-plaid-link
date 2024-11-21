import { createScript } from "solid-create-script";
import { type Accessor, createEffect, createResource, type JSX, onCleanup, splitProps } from "solid-js";

import { PLAID_LINK_PROPS, PLAID_LINK_STABLE_URL } from "../constants";
import type { CreatePlaidLinkConfig } from "../types";

export type PlaidEmbeddedLinkProps = CreatePlaidLinkConfig &
  JSX.HTMLAttributes<HTMLDivElement> & {
    readonly onLoadError?: (error: Error) => void;
  };

/**
 * ## Summary
 *
 * Solid component that renders the embedded version of the Plaid Link UI using a `div` container.
 *
 * ## Usage
 *
 * ```tsx
 * import { PlaidEmbeddedLink } from "@danchez/solid-plaid-link";
 *
 * const MyComponent = () => (
 *  <PlaidEmbeddedLink
 *    fetchToken={() => fetch("https://api.example.com/plaid/link-token").then((response) => response.json())}
 *    onLoad={() => { ... }}
 *    onLoadError={(error) => { ... }}
 *    onSuccess={(publicToken, metaData) => { ... }}
 *    onEvent={(eventName, metaData) => { ... }}
 *    onExit={(error, metaData) => { ... }}
 *  />
 * );
 */
const PlaidEmbeddedLink = (props: PlaidEmbeddedLinkProps) => {
  let embeddedLinkTarget!: HTMLDivElement;
  const [plaidLinkProps, divProps] = splitProps(props, PLAID_LINK_PROPS);
  const [tokenProps, plaidProps] = splitProps(plaidLinkProps, ["fetchToken"]);

  const script = createScript(PLAID_LINK_STABLE_URL, {
    defer: true,
  });

  const [tokenRequest, { refetch }] = createResource(() => tokenProps.fetchToken());
  const error: Accessor<Error | null> = () => script.error || tokenRequest.error || null;

  createEffect(() => {
    if (!error()) return;
    props.onLoadError?.(error() as Error);
  });

  createEffect(() => {
    if (script.loading || tokenRequest.loading) return;

    if (script.error || typeof window === "undefined" || !window.Plaid) {
      console.error("solid-plaid-link: Error loading Plaid script.", script.error?.message);
      return;
    }

    const { link_token, expiration } = tokenRequest() ?? { link_token: "", expiration: "" };

    if (!link_token || !expiration) {
      console.error("solid-plaid-link: fetchToken response missing link token or expiration date.");
      return;
    }

    const plaidConfig = { ...plaidProps, token: link_token };

    // The embedded Link interface doesn't use the `createPlaidLink` hook to manage
    // its Plaid Link instance because the embedded Link integration in link-initialize
    // maintains its own handler internally.
    const { destroy } = window.Plaid.createEmbedded(plaidConfig, embeddedLinkTarget);

    const now = Date.now();
    const expirationTime = new Date(expiration).getTime();
    const timeUntilLinkTokenExpires = expirationTime - now;

    // Link Tokens expire after 4 hours. Set a timer to refresh the token 5 minutes before it does.
    const timerId = setTimeout(refetch, timeUntilLinkTokenExpires - 5 * 60 * 1000);

    onCleanup(() => {
      clearTimeout(timerId);
      destroy();
    });
  });

  return <div ref={embeddedLinkTarget} {...divProps} />;
};

export default PlaidEmbeddedLink;
