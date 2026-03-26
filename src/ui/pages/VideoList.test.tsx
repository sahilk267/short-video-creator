import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("../services/apiClient", () => ({
  default: {
    getAxiosInstance: () => ({
      get: vi.fn(),
      delete: vi.fn(),
    }),
  },
}));

import VideoList from "./VideoList";

describe("VideoList", () => {
  it("renders the initial loading state", () => {
    const markup = renderToStaticMarkup(<VideoList />);

    expect(markup).toContain("MuiCircularProgress");
    expect(markup).not.toContain("Your Videos");
  });
});
