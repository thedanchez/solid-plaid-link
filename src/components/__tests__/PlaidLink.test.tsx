import { render } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";
import { createScript } from "solid-create-script";
import { createRoot, createSignal } from "solid-js";
import { beforeEach, describe, expect, it, type MockedFunction, vi } from "vitest";

import { createFakeResource } from "../../testUtils";
import type { PlaidHandler } from "../../types";
import PlaidLink from "../PlaidLink";

vi.mock("solid-create-script");
const mockCreateScript = createScript as MockedFunction<typeof createScript>;

describe("COMPONENT: <PlaidLink />", () => {
  let fakePlaidLink: PlaidHandler;

  beforeEach(() => {
    mockCreateScript.mockImplementationOnce(() =>
      createFakeResource({
        loading: false,
        state: "ready",
      }),
    );

    fakePlaidLink = {
      submit: vi.fn(),
      exit: vi.fn(),
      open: vi.fn(),
      destroy: vi.fn(),
    };

    window.Plaid = {
      createEmbedded: vi.fn(),
      create: () => fakePlaidLink,
    };
  });

  it("renders correctly on screen", async () => {
    const { getByText } = render(() => (
      <PlaidLink
        fetchToken={vi.fn(async () => ({ link_token: "test-token", expiration: "2024-11-25T14:30:00Z" }))}
        onSuccess={vi.fn()}
      >
        Open
      </PlaidLink>
    ));

    expect(getByText("Open")).toBeInTheDocument();

    await userEvent.click(getByText("Open"));

    expect(fakePlaidLink.open).toHaveBeenCalled();
  });

  it("runs additional onClick logic when supplied as a prop", async () => {
    const [didClick, setDidClick] = createSignal(false);

    const { getByText } = render(() => (
      <PlaidLink
        fetchToken={vi.fn(async () => ({ link_token: "test-token", expiration: "2024-11-25T14:30:00Z" }))}
        onSuccess={vi.fn()}
        onClick={() => setDidClick(true)}
      >
        Open
      </PlaidLink>
    ));

    await createRoot(async (dispose) => {
      expect(getByText("Open")).toBeInTheDocument();
      expect(didClick()).toBe(false);

      await userEvent.click(getByText("Open"));

      expect(fakePlaidLink.open).toHaveBeenCalled();
      expect(didClick()).toBe(true);

      dispose();
    });
  });
});
