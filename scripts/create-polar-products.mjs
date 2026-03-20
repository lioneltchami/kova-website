#!/usr/bin/env node

/**
 * Kova - Create Polar.sh Products
 *
 * This script creates all 4 Kova subscription products on Polar.sh.
 * Run it once to set up your pricing tiers.
 *
 * Reads from .env file automatically if present.
 *
 * Usage:
 *   node scripts/create-polar-products.mjs
 *
 * Products created:
 *   1. Kova Pro - Monthly ($15/seat/month)
 *   2. Kova Pro - Annual ($144/seat/year = $12/seat/month)
 *   3. Kova Enterprise - Monthly ($30/seat/month)
 *   4. Kova Enterprise - Annual ($288/seat/year = $24/seat/month)
 *
 * After running, set these environment variables with the returned product IDs:
 *   POLAR_PRODUCT_PRO_MONTHLY
 *   POLAR_PRODUCT_PRO_ANNUAL
 *   POLAR_PRODUCT_ENTERPRISE_MONTHLY
 *   POLAR_PRODUCT_ENTERPRISE_ANNUAL
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env file if it exists
try {
  const envPath = resolve(process.cwd(), ".env");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
  console.log("Loaded .env file");
} catch {
  // No .env file, rely on environment variables
}

// Use sandbox if POLAR_SANDBOX=true, otherwise production
const useSandbox = process.env.POLAR_SANDBOX === "true";
const POLAR_API_URL = useSandbox
  ? "https://sandbox-api.polar.sh/v1"
  : "https://api.polar.sh/v1";

const accessToken = process.env.POLAR_ACCESS_TOKEN;
const orgId = process.env.POLAR_ORG_ID;

if (!accessToken) {
  console.error("Error: POLAR_ACCESS_TOKEN environment variable is required.");
  console.error("Get your token at: https://polar.sh/settings/developers");
  process.exit(1);
}

if (!orgId) {
  console.error("Error: POLAR_ORG_ID environment variable is required.");
  console.error("Find your org ID in your Polar.sh organization settings URL.");
  process.exit(1);
}

const products = [
  {
    name: "Kova Pro - Monthly",
    description: [
      "All 5 AI tools tracked, 1-year cloud history, team dashboard, and budget alerts.",
      "",
      "Includes:",
      "- All 5 tools: Cursor, Copilot, Windsurf, Devin + Claude Code",
      "- 1-year cloud history",
      "- Team dashboard with per-member costs",
      "- Budget alerts (daily + monthly)",
      "- CSV / JSON export",
      "- Email support",
      "",
      "All free CLI features remain free forever.",
    ].join("\n"),
    prices: [
      {
        amount_type: "fixed",
        price_amount: 1500, // $15.00/seat/month in cents
        price_currency: "usd",
      },
    ],
    recurring_interval: "month",
    metadata: {
      plan: "pro",
      billing: "monthly",
    },
  },
  {
    name: "Kova Pro - Annual",
    description: [
      "All 5 AI tools tracked, 1-year cloud history, team dashboard, and budget alerts.",
      "Save 20% with annual billing ($12/seat/month billed $144/seat/year).",
      "",
      "Includes:",
      "- All 5 tools: Cursor, Copilot, Windsurf, Devin + Claude Code",
      "- 1-year cloud history",
      "- Team dashboard with per-member costs",
      "- Budget alerts (daily + monthly)",
      "- CSV / JSON export",
      "- Email support",
      "",
      "All free CLI features remain free forever.",
    ].join("\n"),
    prices: [
      {
        amount_type: "fixed",
        price_amount: 14400, // $144.00/seat/year ($12/seat/month) in cents
        price_currency: "usd",
      },
    ],
    recurring_interval: "year",
    metadata: {
      plan: "pro",
      billing: "annual",
    },
  },
  {
    name: "Kova Enterprise - Monthly",
    description: [
      "Pro plus SSO, audit log exports, API access, and priority support.",
      "",
      "Includes everything in Pro, plus:",
      "- SSO / SAML integration",
      "- Audit log exports",
      "- REST API access",
      "- Priority support + SLA",
      "- Custom data retention",
      "- Dedicated onboarding",
      "",
      "All free CLI features remain free forever.",
    ].join("\n"),
    prices: [
      {
        amount_type: "fixed",
        price_amount: 3000, // $30.00/seat/month in cents
        price_currency: "usd",
      },
    ],
    recurring_interval: "month",
    metadata: {
      plan: "enterprise",
      billing: "monthly",
    },
  },
  {
    name: "Kova Enterprise - Annual",
    description: [
      "Pro plus SSO, audit log exports, API access, and priority support.",
      "Save 20% with annual billing ($24/seat/month billed $288/seat/year).",
      "",
      "Includes everything in Pro, plus:",
      "- SSO / SAML integration",
      "- Audit log exports",
      "- REST API access",
      "- Priority support + SLA",
      "- Custom data retention",
      "- Dedicated onboarding",
      "",
      "All free CLI features remain free forever.",
    ].join("\n"),
    prices: [
      {
        amount_type: "fixed",
        price_amount: 28800, // $288.00/seat/year ($24/seat/month) in cents
        price_currency: "usd",
      },
    ],
    recurring_interval: "year",
    metadata: {
      plan: "enterprise",
      billing: "annual",
    },
  },
];

async function createProduct(product) {
  const body = {
    name: product.name,
    description: product.description,
    prices: product.prices,
    recurring_interval: product.recurring_interval,
    metadata: product.metadata,
  };

  const response = await fetch(`${POLAR_API_URL}/products/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create "${product.name}": ${response.status} ${errorText}`);
  }

  return response.json();
}

async function main() {
  console.log("Kova - Creating Polar.sh Products");
  console.log("==================================");
  console.log(`Organization: ${orgId}`);
  console.log(`API: ${POLAR_API_URL}`);
  console.log("");

  const results = [];

  for (const product of products) {
    process.stdout.write(`Creating "${product.name}"... `);
    try {
      const result = await createProduct(product);
      console.log(`OK (ID: ${result.id})`);
      results.push({
        name: product.name,
        id: result.id,
        plan: product.metadata.plan,
        billing: product.metadata.billing,
        price: product.prices[0].priceAmount / 100,
        interval: product.recurringInterval,
      });
    } catch (error) {
      console.log(`FAILED`);
      console.error(`  ${error.message}`);
    }
  }

  console.log("");
  console.log("==================================");
  console.log("Results:");
  console.log("");

  for (const r of results) {
    console.log(`  ${r.name}`);
    console.log(`    ID:       ${r.id}`);
    console.log(`    Plan:     ${r.plan}`);
    console.log(`    Price:    $${r.price}/${r.interval}`);
    console.log("");
  }

  if (results.length === 4) {
    console.log("All 4 products created successfully.");
    console.log("");
    console.log("Next steps:");
    console.log("1. Set up a webhook at https://polar.sh/settings/webhooks");
    console.log(`   URL: https://YOUR_DOMAIN/api/webhooks/polar`);
    console.log("   Events: subscription.created, subscription.updated, subscription.canceled, subscription.revoked");
    console.log("");
    console.log("2. Update your pricing page checkout links to use these product IDs.");
    console.log("");
    console.log("3. Save these product IDs for reference:");
    for (const r of results) {
      console.log(`   ${r.plan}_${r.billing} = ${r.id}`);
    }
  } else {
    console.log(`Warning: Only ${results.length}/4 products were created. Check errors above.`);
  }
}

main().catch((err) => {
  console.error("Script failed:", err.message);
  process.exit(1);
});
