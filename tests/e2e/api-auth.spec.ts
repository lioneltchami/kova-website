import { expect, test } from "@playwright/test";

test("POST /api/v1/usage without auth returns 401", async ({ request }) => {
  const response = await request.post("/api/v1/usage", {
    data: { records: [] },
  });
  expect(response.status()).toBe(401);
});

test("GET /api/v1/usage/export without session returns 401", async ({
  request,
}) => {
  const response = await request.get("/api/v1/usage/export");
  expect(response.status()).toBe(401);
});

test("GET /api/v1/budget without session returns 401", async ({ request }) => {
  const response = await request.get("/api/v1/budget");
  expect(response.status()).toBe(401);
});
