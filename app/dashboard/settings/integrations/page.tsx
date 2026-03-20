import Link from "next/link";
import { redirect } from "next/navigation";
import { IntegrationDisconnectButtons } from "@/components/dashboard/integration-disconnect-buttons";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Integrations",
};

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ github?: string; slack?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [{ data: githubInstall }, { data: slackIntegration }, resolvedParams] =
    await Promise.all([
      admin
        .from("github_app_installations")
        .select("installation_id, account_login, created_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      admin
        .from("slack_integrations")
        .select("team_name, team_id, updated_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      searchParams,
    ]);

  const slackClientId = process.env.SLACK_CLIENT_ID;
  const slackOAuthUrl = slackClientId
    ? `https://slack.com/oauth/v2/authorize?client_id=${slackClientId}&scope=commands,chat:write&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL ?? "https://kova.dev")}/api/slack/oauth`
    : null;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-2">Integrations</h1>
      <p className="text-sm text-kova-silver-dim mb-6">
        Connect external tools to enrich your Kova experience with PR comments,
        Slack commands, and more.
      </p>

      {/* Status banners */}
      {resolvedParams.github === "connected" && (
        <div className="mb-4 px-4 py-3 bg-green-900/30 border border-green-700 rounded-lg text-sm text-green-400">
          GitHub App connected successfully.
        </div>
      )}
      {resolvedParams.slack === "connected" && (
        <div className="mb-4 px-4 py-3 bg-green-900/30 border border-green-700 rounded-lg text-sm text-green-400">
          Slack workspace connected successfully.
        </div>
      )}
      {(resolvedParams.github === "error" ||
        resolvedParams.slack === "error") && (
        <div className="mb-4 px-4 py-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-400">
          Connection failed. Please try again.
        </div>
      )}

      {/* GitHub App */}
      <section className="bg-kova-surface border border-kova-border rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-kova-charcoal-light border border-kova-border flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">GitHub App</h2>
              <p className="text-sm text-kova-silver-dim mt-0.5">
                Post AI cost summaries as PR comments automatically.
              </p>
            </div>
          </div>

          {githubInstall ? (
            <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-900/30 border border-green-700 rounded-full text-xs font-medium text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              Connected
            </span>
          ) : (
            <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-kova-charcoal-light border border-kova-border rounded-full text-xs font-medium text-kova-silver-dim">
              <span className="w-1.5 h-1.5 rounded-full bg-kova-silver-dim inline-block" />
              Not connected
            </span>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-kova-border">
          {githubInstall ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-kova-silver">
                  <span className="text-kova-silver-dim">Account:</span>{" "}
                  <span className="font-mono text-white">
                    {githubInstall.account_login}
                  </span>
                </p>
                <p className="text-xs text-kova-silver-dim mt-1">
                  Installation ID: {githubInstall.installation_id}
                </p>
              </div>
              <IntegrationDisconnectButtons userId={user.id} type="github" />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-kova-silver-dim">
                Install the Kova GitHub App to enable automated PR cost
                reporting.
              </p>
              <Link
                href="https://github.com/apps/kova-finops/installations/new"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 px-4 py-2 bg-kova-blue text-white text-sm font-medium rounded-lg hover:bg-kova-blue-light transition-colors"
              >
                Install GitHub App
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Slack */}
      <section className="bg-kova-surface border border-kova-border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-kova-charcoal-light border border-kova-border flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6.194 14.644c0 1.16-.943 2.107-2.103 2.107-1.16 0-2.103-.946-2.103-2.107 0-1.16.943-2.107 2.103-2.107H6.194v2.107zm1.061 0c0-1.16.943-2.107 2.103-2.107 1.16 0 2.103.946 2.103 2.107v5.245c0 1.16-.943 2.107-2.103 2.107-1.16 0-2.103-.946-2.103-2.107v-5.245z"
                  fill="#E01E5A"
                />
                <path
                  d="M9.358 6.195c-1.16 0-2.103-.946-2.103-2.107 0-1.16.943-2.107 2.103-2.107 1.16 0 2.103.946 2.103 2.107v2.107H9.358zm0 1.06c1.16 0 2.103.946 2.103 2.107 0 1.16-.943 2.107-2.103 2.107H4.09c-1.16 0-2.103-.946-2.103-2.107 0-1.16.943-2.107 2.103-2.107h5.268z"
                  fill="#36C5F0"
                />
                <path
                  d="M17.806 9.362c0-1.16.943-2.107 2.103-2.107 1.16 0 2.103.946 2.103 2.107 0 1.16-.943 2.107-2.103 2.107h-2.103V9.362zm-1.06 0c0 1.16-.943 2.107-2.103 2.107-1.16 0-2.103-.946-2.103-2.107V4.117c0-1.16.943-2.107 2.103-2.107 1.16 0 2.103.946 2.103 2.107v5.245z"
                  fill="#2EB67D"
                />
                <path
                  d="M14.643 17.806c1.16 0 2.103.946 2.103 2.107 0 1.16-.943 2.107-2.103 2.107-1.16 0-2.103-.946-2.103-2.107v-2.107h2.103zm0-1.06c-1.16 0-2.103-.946-2.103-2.107 0-1.16.943-2.107 2.103-2.107h5.268c1.16 0 2.103.946 2.103 2.107 0 1.16-.943 2.107-2.103 2.107h-5.268z"
                  fill="#ECB22E"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Slack</h2>
              <p className="text-sm text-kova-silver-dim mt-0.5">
                Use{" "}
                <code className="text-kova-blue font-mono text-xs bg-kova-charcoal-light px-1.5 rounded">
                  /kova
                </code>{" "}
                slash command and receive budget alerts in Slack.
              </p>
            </div>
          </div>

          {slackIntegration ? (
            <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-900/30 border border-green-700 rounded-full text-xs font-medium text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              Connected
            </span>
          ) : (
            <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-kova-charcoal-light border border-kova-border rounded-full text-xs font-medium text-kova-silver-dim">
              <span className="w-1.5 h-1.5 rounded-full bg-kova-silver-dim inline-block" />
              Not connected
            </span>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-kova-border">
          {slackIntegration ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-kova-silver">
                  <span className="text-kova-silver-dim">Workspace:</span>{" "}
                  <span className="font-semibold text-white">
                    {slackIntegration.team_name}
                  </span>
                </p>
                <p className="text-xs text-kova-silver-dim mt-1">
                  Team ID: {slackIntegration.team_id}
                </p>
              </div>
              <IntegrationDisconnectButtons userId={user.id} type="slack" />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-kova-silver-dim">
                Connect your Slack workspace to use the{" "}
                <code className="text-kova-blue font-mono text-xs">/kova</code>{" "}
                command and get budget alerts.
              </p>
              {slackOAuthUrl ? (
                <Link
                  href={slackOAuthUrl}
                  className="flex-shrink-0 px-4 py-2 bg-kova-blue text-white text-sm font-medium rounded-lg hover:bg-kova-blue-light transition-colors"
                >
                  Connect Slack
                </Link>
              ) : (
                <span className="text-xs text-kova-silver-dim italic">
                  Slack not configured
                </span>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
