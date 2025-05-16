import { createScript } from "@dschz/solid-create-script";
import { waitFor } from "@solidjs/testing-library";
import { createRoot } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, type MockedFunction, vi } from "vitest";

import { createFakeResource } from "../../testUtils";
import type { PlaidHandler } from "../../types";
import createPlaidLink from "../createPlaidLink";

vi.mock("@dschz/solid-create-script");
const mockCreateScript = createScript as MockedFunction<typeof createScript>;

const TEST_TOKEN = "test-token";

describe("HOOK: createPlaidLink", () => {
  let mockPlaidHandler: PlaidHandler;

  beforeEach(() => {
    mockPlaidHandler = {
      open: vi.fn(),
      submit: vi.fn(),
      exit: vi.fn(),
      destroy: vi.fn(),
    };

    window.Plaid = {
      createEmbedded: vi.fn(),
      create: ({ onLoad }) => {
        onLoad?.();
        return mockPlaidHandler;
      },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("provides no-op Plaid Link client when not ready", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementationOnce(() => {});

    mockCreateScript.mockImplementationOnce(() =>
      createFakeResource({
        loading: true,
        state: "pending",
      }),
    );

    createRoot((dispose) => {
      const { plaidLink } = createPlaidLink(() => ({
        fetchToken: () => Promise.resolve({ link_token: TEST_TOKEN, expiration: "2024-11-25T14:30:00Z" }),
        onSuccess: vi.fn(),
      }));

      plaidLink().open();
      expect(mockPlaidHandler.open).not.toHaveBeenCalled();

      waitFor(() =>
        expect(consoleSpy).toHaveBeenCalledWith("solid-plaid-link: Plaid Link is not ready yet. This is a no-op."),
      );

      plaidLink().exit();
      expect(mockPlaidHandler.exit).not.toHaveBeenCalled();

      plaidLink().submit({ phone_number: "" });
      expect(mockPlaidHandler.submit).not.toHaveBeenCalled();

      dispose();
    });
  });

  it("is not ready when script is loading", () => {
    mockCreateScript.mockImplementationOnce(() =>
      createFakeResource({
        loading: true,
        state: "pending",
      }),
    );

    createRoot((dispose) => {
      const { ready, error } = createPlaidLink(() => ({
        fetchToken: () => Promise.resolve({ link_token: TEST_TOKEN, expiration: "2024-11-25T14:30:00Z" }),
        onSuccess: vi.fn(),
      }));

      expect(ready()).toEqual(false);
      expect(error()).toEqual(null);

      dispose();
    });
  });

  it("is not ready when script fails to load", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementationOnce(() => {});

    mockCreateScript.mockImplementationOnce(() =>
      createFakeResource({
        loading: false,
        state: "errored",
        error: new Error("SCRIPT_LOAD_ERROR"),
      }),
    );

    createRoot(async (dispose) => {
      const { ready, error } = createPlaidLink(() => ({
        fetchToken: () => Promise.resolve({ link_token: TEST_TOKEN, expiration: "2024-11-25T14:30:00Z" }),
        onSuccess: vi.fn(),
      }));

      expect(ready()).toEqual(false);
      expect(error()).toEqual(new Error("SCRIPT_LOAD_ERROR"));

      await waitFor(() =>
        expect(consoleSpy).toHaveBeenCalledWith("solid-plaid-link: Error loading Plaid script.", "SCRIPT_LOAD_ERROR"),
      );

      dispose();
    });
  });

  it("is not ready when fetchToken request is loading", () => {
    mockCreateScript.mockImplementationOnce(() =>
      createFakeResource({
        loading: false,
        state: "ready",
      }),
    );

    createRoot((dispose) => {
      const { ready } = createPlaidLink(() => ({
        fetchToken: () => Promise.resolve({ link_token: TEST_TOKEN, expiration: "" }),
        onSuccess: vi.fn(),
      }));

      expect(ready()).toEqual(false);

      dispose();
    });
  });

  it("is not ready when fetchToken request fails", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementationOnce(() => {});

    mockCreateScript.mockImplementationOnce(() =>
      createFakeResource({
        loading: false,
        state: "ready",
      }),
    );

    createRoot(async (dispose) => {
      const { ready, error } = createPlaidLink(() => ({
        fetchToken: () => Promise.reject(new Error("FETCH_TOKEN_ERROR")),
        onSuccess: vi.fn(),
      }));

      expect(ready()).toEqual(false);
      waitFor(() => expect(error()).toEqual(new Error("FETCH_TOKEN_ERROR")));

      await waitFor(() =>
        expect(consoleSpy).toHaveBeenCalledWith("solid-plaid-link: Error fetching link token.", "FETCH_TOKEN_ERROR"),
      );

      dispose();
    });
  });

  it("is not ready when fetchToken request fails to return a link token", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementationOnce(() => {});

    mockCreateScript.mockImplementationOnce(() =>
      createFakeResource({
        loading: false,
        state: "ready",
      }),
    );

    createRoot(async (dispose) => {
      const { ready, error } = createPlaidLink(() => ({
        fetchToken: () => Promise.resolve({ link_token: "", expiration: "2024-11-25T14:30:00Z" }),
        onSuccess: vi.fn(),
      }));

      expect(ready()).toEqual(false);
      waitFor(() => expect(error()).toEqual(new Error("FETCH_TOKEN_ERROR")));

      await waitFor(() =>
        expect(consoleSpy).toHaveBeenCalledWith("solid-plaid-link: Error fetching link token.", "FETCH_TOKEN_ERROR"),
      );

      dispose();
    });
  });

  it("is not ready when fetchToken request fails to return a link token expiration", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementationOnce(() => {});

    mockCreateScript.mockImplementationOnce(() =>
      createFakeResource({
        loading: false,
        state: "ready",
      }),
    );

    createRoot(async (dispose) => {
      const { ready, error } = createPlaidLink(() => ({
        fetchToken: () => Promise.resolve({ link_token: TEST_TOKEN, expiration: "" }),
        onSuccess: vi.fn(),
      }));

      expect(ready()).toEqual(false);
      waitFor(() => expect(error()).toEqual(new Error("FETCH_TOKEN_ERROR")));

      await waitFor(() =>
        expect(consoleSpy).toHaveBeenCalledWith("solid-plaid-link: Error fetching link token.", "FETCH_TOKEN_ERROR"),
      );

      dispose();
    });
  });

  it("creates Plaid Link handler when script is ready and link token received", async () => {
    vi.setSystemTime(new Date(2024, 10, 24).getTime());

    const setTimeoutMock = vi.spyOn(global, "setTimeout").mockImplementation(() => {
      return 1234 as unknown as NodeJS.Timeout;
    });

    mockCreateScript.mockImplementationOnce(() =>
      createFakeResource({
        loading: false,
        state: "ready",
      }),
    );

    await createRoot(async (dispose) => {
      const { ready, plaidLink } = createPlaidLink(() => ({
        fetchToken: () => Promise.resolve({ link_token: TEST_TOKEN, expiration: "2024-11-24T08:00:00Z" }),
        onSuccess: vi.fn(),
      }));

      await waitFor(() => expect(ready()).toEqual(true));

      plaidLink().open();
      expect(mockPlaidHandler.open).toHaveBeenCalled();

      plaidLink().exit();
      expect(mockPlaidHandler.exit).toHaveBeenCalled();

      plaidLink().submit({ phone_number: "" });
      expect(mockPlaidHandler.submit).toHaveBeenCalled();

      expect(setTimeoutMock).toHaveBeenCalledWith(expect.any(Function), expect.any(Number));

      dispose();
    });
  });
});
