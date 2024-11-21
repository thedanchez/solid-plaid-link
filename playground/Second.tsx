import { createScript } from "solid-create-script";

export const Second = () => {
  const script = createScript("https://cdn.plaid.com/link/v2/stable/link-initialize.js", { defer: true });

  return (
    <div>
      <div>Second Component</div>
      <div>Script Loading State: {script.loading.toString()}</div>
    </div>
  );
};
