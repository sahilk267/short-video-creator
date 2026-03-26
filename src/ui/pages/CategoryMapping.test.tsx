import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../services/apiClient", () => ({
  api: {
    channels: {
      list: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import CategoryMapping from "./CategoryMapping";

describe("CategoryMapping", () => {
  it("renders the mapping form and empty-state copy", () => {
    const markup = renderToStaticMarkup(<CategoryMapping />);

    expect(markup).toContain("Category Channel Mapping");
    expect(markup).toContain("Save Mapping");
    expect(markup).toContain("Existing Mappings");
    expect(markup).toContain("No mappings yet.");
  });
});
