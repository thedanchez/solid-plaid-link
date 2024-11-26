import { createEffect, type JSX, type ParentProps, splitProps } from "solid-js";

import { PLAID_LINK_PROPS } from "../constants";
import createPlaidLink from "../hooks/createPlaidLink";
import type { CreatePlaidLinkConfig } from "../types";

type PlaidLinkProps = CreatePlaidLinkConfig &
  JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
    readonly onLoadError?: (error: Error) => void;
  };

/**
 * ## Summary
 *
 * A button which opens the Plaid Link UI on click. If there are any issues downloading Plaid or creating the Plaid Link
 * instance, the button will be disabled.
 *
 * It is built on top of `createPlaidLink` so it accepts all the same configuration fields along with all the
 * `ButtonHTMLAttributes` as props so you are free to customize the button with your own styles. Additionally, you can
 * enrich the `disabled` or `onClick` with your own logic alongside the default behaviors if you so choose.
 *
 * One thing to note with respect to `fetchToken`: in Solid, JSX is a reactively tracked scope and the reactivity system
 * in Solid only tracks ***synchronously*** -- therefore, components cannot receive `async` functions as values. To
 * workaround this, the function passed to `fetchToken` for the Plaid Link JSX components must use promise chaining
 * instead of relying on `async/await` syntax.
 *
 * ## Usage
 *
 * ```tsx
 * import { PlaidLink } from "@danchez/solid-plaid-link";
 *
 * const MyComponent = () => (
 *  <PlaidLink
 *    fetchToken={() => fetch("https://api.example.com/plaid/link-token").then((response) => response.json())}
 *    onLoad={() => { ... }}
 *    onLoadError={(error) => { ... }}
 *    onSuccess={(publicToken, metaData) => { ... }}
 *    onEvent={(eventName, metaData) => { ... }}
 *    onExit={(error, metaData) => { ... }}
 *  >
 *   Open Plaid Link
 *  </PlaidLink>
 * );
 */
const PlaidLink = (props: ParentProps<PlaidLinkProps>) => {
  const [plaidProps, btnProps] = splitProps(props, PLAID_LINK_PROPS);
  const [localProps, otherBtnProps] = splitProps(btnProps, ["disabled", "onClick"]);
  const { ready, error, plaidLink } = createPlaidLink(() => plaidProps);

  createEffect(() => {
    if (!error()) return;
    props.onLoadError?.(error() as Error);
  });

  return (
    <button
      {...otherBtnProps}
      disabled={!ready() || Boolean(localProps.disabled)}
      onClick={(e) => {
        if (typeof localProps.onClick === "function") {
          localProps.onClick?.(e);
        }

        plaidLink().open();
      }}
    />
  );
};

export default PlaidLink;
