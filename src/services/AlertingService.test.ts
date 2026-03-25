import { describe, expect, it } from "vitest";
import { AlertingService } from "./AlertingService";

describe("AlertingService", () => {
  it("can be constructed with config-like input", () => {
    const service = new AlertingService({
      slackWebhookUrl: "",
      pagerDutyRoutingKey: "",
      alertEmailTo: "",
    } as any);
    expect(service).toBeDefined();
  });
});
