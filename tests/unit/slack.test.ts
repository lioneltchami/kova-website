import { describe, expect, it, vi, afterEach } from "vitest";
import {
  buildBudgetAlertBlocks,
  buildAnomalyAlertBlocks,
  sendSlackNotification,
} from "@/lib/slack";

// ---------------------------------------------------------------------------
// buildBudgetAlertBlocks
// ---------------------------------------------------------------------------

describe("buildBudgetAlertBlocks: block structure", () => {
  const baseParams = {
    teamName: "Acme Eng",
    period: "March 2026",
    budgetAmount: 100,
    currentSpend: 80,
    dashboardUrl: "https://kova.ai/dashboard",
  };

  it("returns exactly 3 blocks", () => {
    const blocks = buildBudgetAlertBlocks(baseParams);
    expect(blocks).toHaveLength(3);
  });

  it("first block is a header", () => {
    const blocks = buildBudgetAlertBlocks(baseParams) as Array<{
      type: string;
    }>;
    expect(blocks[0].type).toBe("header");
  });

  it("second block is a section with mrkdwn containing team name and percentage", () => {
    const blocks = buildBudgetAlertBlocks(baseParams) as Array<{
      type: string;
      text: { type: string; text: string };
    }>;
    const section = blocks[1];
    expect(section.type).toBe("section");
    expect(section.text.type).toBe("mrkdwn");
    expect(section.text.text).toContain("Acme Eng");
    expect(section.text.text).toContain("80%");
  });

  it("third block is actions with a View Dashboard button linking to dashboardUrl", () => {
    const blocks = buildBudgetAlertBlocks(baseParams) as Array<{
      type: string;
      elements: Array<{ type: string; url: string }>;
    }>;
    const actions = blocks[2];
    expect(actions.type).toBe("actions");
    expect(actions.elements[0].url).toBe("https://kova.ai/dashboard");
  });

  it("uses rotating_light emoji when spend >= 100% of budget", () => {
    const blocks = buildBudgetAlertBlocks({
      ...baseParams,
      currentSpend: 100,
      budgetAmount: 100,
    }) as Array<{ text: { text: string } }>;
    expect(blocks[0].text.text).toContain(":rotating_light:");
  });

  it("uses warning emoji when spend >= 80% but < 100%", () => {
    const blocks = buildBudgetAlertBlocks({
      ...baseParams,
      currentSpend: 80,
      budgetAmount: 100,
    }) as Array<{ text: { text: string } }>;
    expect(blocks[0].text.text).toContain(":warning:");
  });

  it("uses moneybag emoji when spend < 80%", () => {
    const blocks = buildBudgetAlertBlocks({
      ...baseParams,
      currentSpend: 50,
      budgetAmount: 100,
    }) as Array<{ text: { text: string } }>;
    expect(blocks[0].text.text).toContain(":moneybag:");
  });
});

// ---------------------------------------------------------------------------
// buildAnomalyAlertBlocks
// ---------------------------------------------------------------------------

describe("buildAnomalyAlertBlocks: block structure", () => {
  const baseParams = {
    toolName: "Cursor",
    date: "2026-03-19",
    cost: 45.5,
    expectedCost: 10,
    deviation: "+355%",
    dashboardUrl: "https://kova.ai/analytics",
  };

  it("returns exactly 3 blocks", () => {
    const blocks = buildAnomalyAlertBlocks(baseParams);
    expect(blocks).toHaveLength(3);
  });

  it("first block is a header containing anomaly text", () => {
    const blocks = buildAnomalyAlertBlocks(baseParams) as Array<{
      type: string;
      text: { text: string };
    }>;
    expect(blocks[0].type).toBe("header");
    expect(blocks[0].text.text).toContain("Anomaly");
  });

  it("section text contains the tool name and deviation", () => {
    const blocks = buildAnomalyAlertBlocks(baseParams) as Array<{
      type: string;
      text: { type: string; text: string };
    }>;
    const section = blocks[1];
    expect(section.text.text).toContain("Cursor");
    expect(section.text.text).toContain("+355%");
  });

  it("section text includes actual and expected cost formatted to 2 decimal places", () => {
    const blocks = buildAnomalyAlertBlocks(baseParams) as Array<{
      type: string;
      text: { text: string };
    }>;
    expect(blocks[1].text.text).toContain("45.50");
    expect(blocks[1].text.text).toContain("10.00");
  });

  it("actions block links to dashboardUrl", () => {
    const blocks = buildAnomalyAlertBlocks(baseParams) as Array<{
      type: string;
      elements: Array<{ url: string }>;
    }>;
    expect(blocks[2].elements[0].url).toBe("https://kova.ai/analytics");
  });
});

// ---------------------------------------------------------------------------
// sendSlackNotification
// ---------------------------------------------------------------------------

describe("sendSlackNotification", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when fetch succeeds with ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true } as Response),
    );

    const result = await sendSlackNotification("https://hooks.slack.com/test", {
      text: "Budget alert",
    });

    expect(result).toBe(true);
  });

  it("returns false when fetch returns a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 400 } as Response),
    );

    const result = await sendSlackNotification("https://hooks.slack.com/test", {
      text: "Budget alert",
    });

    expect(result).toBe(false);
  });

  it("returns false and does not throw when fetch rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network failure")),
    );

    const result = await sendSlackNotification("https://hooks.slack.com/test", {
      text: "Budget alert",
    });

    expect(result).toBe(false);
  });

  it("sends a POST request with JSON content-type to the webhook URL", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal("fetch", mockFetch);

    const webhookUrl = "https://hooks.slack.com/services/abc";
    const message = { text: "Hello", blocks: [] };
    await sendSlackNotification(webhookUrl, message);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [
      string,
      RequestInit & { body: string },
    ];
    expect(url).toBe(webhookUrl);
    expect((init as RequestInit).method).toBe("POST");
    expect(
      (init as { headers: Record<string, string> }).headers["Content-Type"],
    ).toBe("application/json");
    expect(JSON.parse((init as { body: string }).body)).toEqual(message);
  });
});
