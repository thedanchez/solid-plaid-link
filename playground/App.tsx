import { createScript } from "solid-create-script";
import { createEffect, createSignal, Show } from "solid-js";

import { Second } from "./Second";
import { Third } from "./Third";

export const App = () => {
  const [showSecond, setShowSecond] = createSignal(false);
  const [showThird, setShowThird] = createSignal(false);

  const script = createScript("https://cdn.plaid.com/link/v2/stable/link-initialize.js", { defer: true });

  createEffect(() => {
    console.log("Script Error State: ", script.error.message);
  });

  return (
    <div>
      <div>Playground App</div>
      <div>Script Loading State: {script.loading.toString()}</div>
      <div>Script Error: {script.error?.message}</div>
      <button
        onClick={() => {
          setShowSecond((prev) => !prev);
        }}
      >
        Toggle Second
      </button>
      <button
        onClick={() => {
          setShowThird((prev) => !prev);
        }}
      >
        Toggle Third
      </button>
      <Show when={showSecond()}>
        <Second />
      </Show>
      <Show when={showThird()}>
        <Third />
      </Show>
    </div>
  );
};
