import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ videoId: "video-123" }),
}));

vi.mock("../services/apiClient", () => ({
  default: {
    getAxiosInstance: () => ({
      get: vi.fn(),
    }),
  },
}));

import VideoDetails from "./VideoDetails";

describe("VideoDetails", () => {
  it("renders the page shell and initial loading state", () => {
    const markup = renderToStaticMarkup(<VideoDetails />);

    expect(markup).toContain("Video Details");
    expect(markup).toContain("Back to videos");
    expect(markup).toContain("video-123");
    expect(markup).toContain("Processing");
    expect(markup).toContain("MuiCircularProgress");
  });
});
