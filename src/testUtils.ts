import type { Resource } from "solid-js";

type ResourceConfig = {
  readonly state: "ready" | "unresolved" | "pending" | "errored" | "refreshing";
  readonly loading: boolean;
  readonly error?: Error | null;
};

export const createFakeResource = (config: ResourceConfig) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const mockResource: Mocked<Resource<Event>> = vi.fn(() => ({
    id: 1,
    type: "mock-event",
    timestamp: new Date(),
  }));

  mockResource.state = config.state;
  mockResource.loading = config.loading;
  mockResource.error = config.error || null;

  return mockResource;
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
