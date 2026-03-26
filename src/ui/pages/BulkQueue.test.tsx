import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../services/apiClient", () => ({
  default: {
    getAxiosInstance: () => ({
      get: vi.fn(),
      post: vi.fn(),
    }),
  },
}));

import BulkQueue from "./BulkQueue";

describe("BulkQueue", () => {
  it("renders the queue manager shell and empty-state copy", () => {
    const markup = renderToStaticMarkup(<BulkQueue />);

    expect(markup).toContain("Bulk Queue Manager");
    expect(markup).toContain("Queue Render Job");
    expect(markup).toContain("Render Queue States");
    expect(markup).toContain("No queue state data yet.");
  });
});
