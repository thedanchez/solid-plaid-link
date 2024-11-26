import { render, waitFor } from "@solidjs/testing-library";
import { userEvent } from "@testing-library/user-event";
import { createScript } from "solid-create-script";
import { beforeEach, describe, expect, it, type MockedFunction, type MockedObject, vi } from "vitest";

import { createFakeResource } from "../../testUtils";
import type { PlaidHandler } from "../../types";
import PlaidLink from "../PlaidLink";

vi.mock("solid-create-script");
const mockCreateScript = createScript as MockedFunction<typeof createScript>;

describe("COMPONENT: <PlaidLink />", () => {
  let fakePlaidLink: MockedObject<PlaidHandler>;

  beforeEach(() => {
    fakePlaidLink = {
      submit: vi.fn(),
      exit: vi.fn(),
      open: vi.fn(),
      destroy: vi.fn(),
    };

    window.Plaid = {
      createEmbedded: vi.fn(),
      create: ({ onLoad }) => {
        onLoad?.();
        return fakePlaidLink;
      },
    };
  });

  it("is disabled when Plaid Link is not ready", async () => {
    mockCreateScript.mockImplementationOnce(() =>
      createFakeResource({
        loading: true,
        state: "pending",
      }),
    );

    const { getByText } = render(() => (
      <PlaidLink
        fetchToken={() => Promise.resolve({ link_token: "test-token", expiration: "2024-11-25T14:30:00Z" })}
        onSuccess={vi.fn()}
      >
        Open
      </PlaidLink>
    ));

    expect(getByText("Open")).toBeDisabled();
  });

  it("is disabled when user-side disabled is true despite Plaid Link being ready", async () => {
    mockCreateScript.mockImplementationOnce(() =>
      createFakeResource({
        loading: false,
        state: "ready",
      }),
    );

    const { getByText } = render(() => (
      <PlaidLink
        fetchToken={() => Promise.resolve({ link_token: "test-token", expiration: "2024-11-25T14:30:00Z" })}
        onSuccess={vi.fn()}
        disabled
      >
        Open
      </PlaidLink>
    ));

    expect(getByText("Open")).toBeDisabled();
  });

  it("triggers onLoadError when error returns", async () => {
    mockCreateScript.mockImplementationOnce(() =>
      createFakeResource({
        loading: false,
        state: "errored",
        error: new Error("SCRIPT_LOAD"),
      }),
    );

    const onLoadErrorSpy = vi.fn();

    const { getByText } = render(() => (
      <PlaidLink
        fetchToken={() => Promise.resolve({ link_token: "test-token", expiration: "2024-11-25T14:30:00Z" })}
        onSuccess={vi.fn()}
        onLoadError={onLoadErrorSpy}
      >
        Open
      </PlaidLink>
    ));

    expect(getByText("Open")).toBeInTheDocument();

    await userEvent.click(getByText("Open"));

    waitFor(() => expect(onLoadErrorSpy).toHaveBeenCalledWith(new Error("SCRIPT_LOAD")));
  });

  it("is enabled when Plaid Link is ready", async () => {
    mockCreateScript.mockImplementationOnce(() =>
      createFakeResource({
        loading: false,
        state: "ready",
      }),
    );

    const { getByText } = render(() => (
      <PlaidLink
        fetchToken={() => Promise.resolve({ link_token: "test-token", expiration: "2024-11-25T14:30:00Z" })}
        onSuccess={vi.fn()}
      >
        Open
      </PlaidLink>
    ));

    waitFor(() => expect(getByText("Open")).toBeEnabled());

    await userEvent.click(getByText("Open"));

    waitFor(() => expect(fakePlaidLink.open).toHaveBeenCalled());
  });

  it("runs additional onClick logic when supplied as a prop", async () => {
    mockCreateScript.mockImplementationOnce(() =>
      createFakeResource({
        loading: false,
        state: "ready",
      }),
    );

    const onClickSpy = vi.fn();

    const { getByText } = render(() => (
      <PlaidLink
        fetchToken={() => Promise.resolve({ link_token: "test-token", expiration: "2024-11-25T14:30:00Z" })}
        onSuccess={vi.fn()}
        onClick={onClickSpy}
      >
        Open
      </PlaidLink>
    ));

    expect(getByText("Open")).toBeInTheDocument();

    await userEvent.click(getByText("Open"));

    waitFor(() => expect(fakePlaidLink.open).toHaveBeenCalled());

    waitFor(() => expect(onClickSpy).toHaveBeenCalled());
  });
});
