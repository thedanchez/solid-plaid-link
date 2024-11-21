import { render, waitFor } from "@solidjs/testing-library";
import { createScript } from "solid-create-script";
import { createSignal } from "solid-js";
import { beforeEach, describe, expect, it, type MockedFunction, vi } from "vitest";

import { createFakeResource, sleep } from "../../testUtils";
import type { Plaid } from "../../types";
import PlaidEmbeddedLink from "../PlaidEmbeddedLink";

vi.mock("solid-create-script");
const mockCreateScript = createScript as MockedFunction<typeof createScript>;

describe("COMPONENT: <PlaidEmbeddedLink />", () => {
  let createEmbeddedSpy: MockedFunction<Plaid["createEmbedded"]>;
  let destroySpy: MockedFunction<() => void>;

  beforeEach(() => {
    destroySpy = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createEmbeddedSpy = vi.fn((_config, _target) => ({
      destroy: destroySpy,
    }));

    window.Plaid = {
      createEmbedded: createEmbeddedSpy,
      create: vi.fn(),
    };
  });

  it("does not recreate embedded instance if Plaid config did not change", () => {
    mockCreateScript.mockImplementationOnce(() =>
      createFakeResource({
        loading: false,
        state: "ready",
      }),
    );

    const [style, setStyle] = createSignal({ backgroundColor: "red" });

    render(() => (
      <PlaidEmbeddedLink
        fetchToken={() => Promise.resolve({ link_token: "test-token", expiration: "2024-11-25T14:30:00Z" })}
        onSuccess={vi.fn()}
        style={style()}
      />
    ));

    waitFor(() => expect(createEmbeddedSpy).toHaveBeenCalledTimes(1));

    setStyle({ backgroundColor: "blue" });

    waitFor(() => expect(createEmbeddedSpy).toHaveBeenCalledTimes(1));
  });

  it("recreates embedded Plaid instance when config changes", () => {
    mockCreateScript.mockImplementationOnce(() =>
      createFakeResource({
        loading: false,
        state: "ready",
      }),
    );

    const [onSuccess, setOnSuccess] = createSignal(() => {});

    render(() => (
      <PlaidEmbeddedLink
        fetchToken={() =>
          Promise.resolve({
            link_token: "test-token",
            expiration: "2024-11-25T14:30:00Z",
          })
        }
        onSuccess={onSuccess}
      />
    ));

    waitFor(() => expect(createEmbeddedSpy).toHaveBeenCalledTimes(1));

    setOnSuccess(vi.fn());

    waitFor(() => expect(createEmbeddedSpy).toHaveBeenCalledTimes(2));
  });

  it("does not create embedded Plaid instance when script is still loading", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementationOnce(() => {});

    mockCreateScript.mockImplementationOnce(() =>
      createFakeResource({
        loading: true,
        state: "pending",
      }),
    );

    render(() => (
      <PlaidEmbeddedLink
        fetchToken={() => Promise.resolve({ link_token: "test-token", expiration: "2024-11-25T14:30:00Z" })}
        onSuccess={vi.fn()}
      />
    ));

    await sleep(1);

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(createEmbeddedSpy).toHaveBeenCalledTimes(0);
  });

  it("does not create embedded Plaid instance when script errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementationOnce(() => {});

    mockCreateScript.mockImplementationOnce(() =>
      createFakeResource({
        loading: false,
        state: "errored",
        error: new Error("SCRIPT_LOAD_ERROR"),
      }),
    );

    render(() => (
      <PlaidEmbeddedLink
        fetchToken={() => Promise.resolve({ link_token: "test-token", expiration: "2024-11-25T14:30:00Z" })}
        onSuccess={vi.fn()}
      />
    ));

    await waitFor(() =>
      expect(consoleSpy).toHaveBeenCalledWith("solid-plaid-link: Error loading Plaid script.", "SCRIPT_LOAD_ERROR"),
    );

    expect(createEmbeddedSpy).toHaveBeenCalledTimes(0);
  });

  it("does not create embedded Plaid instance when token missing", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementationOnce(() => {});

    mockCreateScript.mockImplementationOnce(() =>
      createFakeResource({
        loading: false,
        state: "ready",
      }),
    );

    render(() => (
      <PlaidEmbeddedLink
        fetchToken={() => Promise.resolve({ link_token: "", expiration: "2024-11-25T14:30:00Z" })}
        onSuccess={vi.fn()}
      />
    ));

    await waitFor(() =>
      expect(consoleSpy).toHaveBeenCalledWith(
        "solid-plaid-link: fetchToken response missing link token or expiration date.",
      ),
    );

    expect(createEmbeddedSpy).toHaveBeenCalledTimes(0);
  });

  it("does not create embedded Plaid instance when expiration missing", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementationOnce(() => {});

    mockCreateScript.mockImplementationOnce(() =>
      createFakeResource({
        loading: false,
        state: "ready",
      }),
    );

    render(() => (
      <PlaidEmbeddedLink
        fetchToken={() => Promise.resolve({ link_token: "test-token", expiration: "" })}
        onSuccess={vi.fn()}
      />
    ));

    await waitFor(() =>
      expect(consoleSpy).toHaveBeenCalledWith(
        "solid-plaid-link: fetchToken response missing link token or expiration date.",
      ),
    );

    expect(createEmbeddedSpy).toHaveBeenCalledTimes(0);
  });
});
