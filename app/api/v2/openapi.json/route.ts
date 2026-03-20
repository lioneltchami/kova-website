import { NextResponse } from "next/server";

// GET /api/v2/openapi.json
// Returns a static OpenAPI 3.1 specification documenting all v2 API routes.

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Kova API v2",
    version: "2.0.0",
    description:
      "Kova AI Dev FinOps API. All endpoints require a Bearer API key unless otherwise noted.",
  },
  servers: [{ url: "/api/v2", description: "API v2" }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "API key (kova_...)",
        description:
          "Obtain an API key from the Kova dashboard. Include as `Authorization: Bearer <key>`. Keys carry scopes: read, write, admin.",
      },
    },
    schemas: {
      Error: {
        type: "object",
        required: ["error", "code"],
        properties: {
          error: {
            type: "string",
            description: "Human-readable error message",
          },
          code: { type: "string", description: "Machine-readable error code" },
        },
      },
      CursorPage: {
        type: "object",
        properties: {
          next_cursor: {
            type: ["string", "null"],
            description: "Cursor for the next page",
          },
          has_more: { type: "boolean" },
        },
      },
      UsageRecord: {
        type: "object",
        properties: {
          id: { type: "string" },
          user_id: { type: "string", format: "uuid" },
          team_id: { type: "string", format: "uuid" },
          tool: { type: "string" },
          model: { type: "string" },
          session_id: { type: "string" },
          project: { type: ["string", "null"] },
          cost_center_id: { type: ["string", "null"], format: "uuid" },
          input_tokens: { type: "integer" },
          output_tokens: { type: "integer" },
          cost_usd: { type: "number" },
          recorded_at: { type: "string", format: "date-time" },
          duration_ms: { type: ["integer", "null"] },
          cli_version: { type: ["string", "null"] },
          tags: { type: "object" },
        },
      },
      CostCenter: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          team_id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: ["string", "null"] },
          budget_usd: { type: ["number", "null"] },
          tags: { type: "object" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      WebhookEndpoint: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          team_id: { type: "string", format: "uuid" },
          url: { type: "string", format: "uri" },
          events: { type: "array", items: { type: "string" } },
          is_active: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      WebhookDelivery: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          endpoint_id: { type: "string", format: "uuid" },
          event_type: { type: "string" },
          payload: { type: "object" },
          status: { type: "string", enum: ["pending", "delivered", "failed"] },
          attempt_count: { type: "integer" },
          next_attempt_at: { type: ["string", "null"], format: "date-time" },
          last_response_code: { type: ["integer", "null"] },
          last_response_body: { type: ["string", "null"] },
          created_at: { type: "string", format: "date-time" },
        },
      },
      AuditEvent: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          created_at: { type: "string", format: "date-time" },
          actor_id: { type: ["string", "null"], format: "uuid" },
          actor_email: { type: ["string", "null"] },
          event_type: { type: "string" },
          resource_type: { type: ["string", "null"] },
          resource_id: { type: ["string", "null"] },
          team_id: { type: ["string", "null"], format: "uuid" },
          old_data: { type: ["object", "null"] },
          new_data: { type: ["object", "null"] },
          metadata: { type: "object" },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    "/usage": {
      get: {
        summary: "List usage records",
        description:
          "Returns cursor-paginated usage records for the authenticated team. Requires read scope.",
        tags: ["Usage"],
        parameters: [
          { name: "cursor", in: "query", schema: { type: "string" } },
          {
            name: "since",
            in: "query",
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "until",
            in: "query",
            schema: { type: "string", format: "date-time" },
          },
          { name: "tool", in: "query", schema: { type: "string" } },
          { name: "model", in: "query", schema: { type: "string" } },
          { name: "project", in: "query", schema: { type: "string" } },
          {
            name: "cost_center_id",
            in: "query",
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Paginated usage records",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/CursorPage" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: { $ref: "#/components/schemas/UsageRecord" },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Forbidden (insufficient scope)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/usage/rollup": {
      get: {
        summary: "Aggregated usage rollup",
        description:
          "Returns usage aggregated by the specified dimension. Requires read scope.",
        tags: ["Usage"],
        parameters: [
          {
            name: "group_by",
            in: "query",
            required: true,
            schema: {
              type: "string",
              enum: ["day", "week", "month", "tool", "model", "cost_center"],
            },
          },
          {
            name: "since",
            in: "query",
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "until",
            in: "query",
            schema: { type: "string", format: "date-time" },
          },
        ],
        responses: {
          "200": {
            description: "Rollup data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid group_by parameter" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/cost-centers": {
      get: {
        summary: "List cost centers",
        tags: ["Cost Centers"],
        responses: {
          "200": {
            description: "Cost centers for the team",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/CostCenter" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a cost center",
        description: "Requires write scope.",
        tags: ["Cost Centers"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  budget_usd: { type: "number" },
                  tags: { type: "object" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created cost center",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/CostCenter" },
                  },
                },
              },
            },
          },
          "400": { description: "Validation error" },
        },
      },
    },
    "/cost-centers/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      get: {
        summary: "Get a cost center",
        tags: ["Cost Centers"],
        responses: {
          "200": { description: "Cost center" },
          "404": { description: "Not found" },
        },
      },
      patch: {
        summary: "Update a cost center",
        description: "Requires write scope.",
        tags: ["Cost Centers"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  budget_usd: { type: ["number", "null"] },
                  tags: { type: "object" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated" },
          "404": { description: "Not found" },
        },
      },
      delete: {
        summary: "Delete a cost center",
        description: "Requires write scope.",
        tags: ["Cost Centers"],
        responses: {
          "204": { description: "Deleted" },
          "404": { description: "Not found" },
        },
      },
    },
    "/webhooks": {
      get: {
        summary: "List webhook endpoints",
        tags: ["Webhooks"],
        responses: { "200": { description: "Webhook endpoints" } },
      },
      post: {
        summary: "Create a webhook endpoint",
        description:
          "Requires write scope. The signing_secret is returned only once.",
        tags: ["Webhooks"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url", "events"],
                properties: {
                  url: { type: "string", format: "uri" },
                  events: {
                    type: "array",
                    items: { type: "string" },
                    example: ["usage.synced"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created endpoint with signing_secret" },
          "400": { description: "Validation error" },
        },
      },
    },
    "/webhooks/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      get: {
        summary: "Get a webhook endpoint",
        tags: ["Webhooks"],
        responses: {
          "200": { description: "Webhook endpoint" },
          "404": { description: "Not found" },
        },
      },
      patch: {
        summary: "Update a webhook endpoint",
        description: "Requires write scope.",
        tags: ["Webhooks"],
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        summary: "Delete a webhook endpoint",
        description: "Requires write scope.",
        tags: ["Webhooks"],
        responses: { "204": { description: "Deleted" } },
      },
    },
    "/webhooks/{id}/deliveries": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      get: {
        summary: "List webhook delivery history",
        tags: ["Webhooks"],
        parameters: [
          { name: "cursor", in: "query", schema: { type: "string" } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", maximum: 100 },
          },
        ],
        responses: {
          "200": {
            description: "Paginated deliveries",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/CursorPage" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: {
                            $ref: "#/components/schemas/WebhookDelivery",
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    "/audit-log": {
      get: {
        summary: "List audit events",
        description:
          "Requires admin scope (API key) or owner/admin role (session). Returns team-scoped audit events.",
        tags: ["Audit"],
        parameters: [
          { name: "cursor", in: "query", schema: { type: "string" } },
          {
            name: "since",
            in: "query",
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "until",
            in: "query",
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "actor_id",
            in: "query",
            schema: { type: "string", format: "uuid" },
          },
          { name: "event_type", in: "query", schema: { type: "string" } },
          { name: "resource_type", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Paginated audit events",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/CursorPage" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "array",
                          items: { $ref: "#/components/schemas/AuditEvent" },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    "/me": {
      delete: {
        summary: "Delete the authenticated user account",
        description:
          "Permanently deletes the account. Requires the `X-Confirm-Delete: true` header. Session auth only.",
        tags: ["Me"],
        parameters: [
          {
            name: "X-Confirm-Delete",
            in: "header",
            required: true,
            schema: { type: "string", enum: ["true"] },
          },
        ],
        responses: {
          "204": { description: "Account deleted" },
          "400": { description: "Missing confirmation header" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/me/export": {
      post: {
        summary: "Request a data export",
        description: "Creates an async data export job. Returns a job ID.",
        tags: ["Me"],
        responses: {
          "202": {
            description: "Export job created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { job_id: { type: "string" } },
                },
              },
            },
          },
        },
      },
      get: {
        summary: "Check data export status",
        description:
          "Returns the export job status and download URL when ready.",
        tags: ["Me"],
        parameters: [
          {
            name: "job_id",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Job status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    job_id: { type: "string" },
                    status: {
                      type: "string",
                      enum: ["pending", "processing", "complete", "failed"],
                    },
                    download_url: { type: ["string", "null"] },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/admin/orgs": {
      get: {
        summary: "List all teams (operator only)",
        tags: ["Admin"],
        responses: {
          "200": { description: "All teams" },
          "403": { description: "Not an operator" },
        },
      },
      patch: {
        summary: "Override team plan (operator only)",
        tags: ["Admin"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["team_id", "plan"],
                properties: {
                  team_id: { type: "string", format: "uuid" },
                  plan: { type: "string", enum: ["free", "pro", "enterprise"] },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Plan updated" },
          "403": { description: "Not an operator" },
        },
      },
    },
    "/admin/users": {
      get: {
        summary: "Search users by email (operator only)",
        tags: ["Admin"],
        parameters: [
          {
            name: "email",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Matching users" },
          "403": { description: "Not an operator" },
        },
      },
      patch: {
        summary: "Set operator flag on a user (operator only)",
        tags: ["Admin"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["user_id", "is_operator"],
                properties: {
                  user_id: { type: "string", format: "uuid" },
                  is_operator: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Flag updated" },
          "403": { description: "Not an operator" },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
