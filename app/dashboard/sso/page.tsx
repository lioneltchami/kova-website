import { SsoSettingsForm } from "@/components/dashboard/sso-settings-form";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "SSO Settings",
};

export default async function SsoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();

  // Get profile to check plan
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const plan = profile?.plan ?? "free";
  const isEnterprise = plan === "enterprise";

  // Get team
  const { data: membership } = await admin
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const teamId = membership?.team_id ?? null;

  // Fetch SSO config if enterprise
  let ssoConfig: {
    idp_metadata_url: string | null;
    connection_status: "connected" | "disconnected" | null;
    last_auth_at: string | null;
  } | null = null;

  if (isEnterprise && teamId) {
    const { data } = await admin
      .from("sso_configurations")
      .select("idp_metadata_url, connection_status, last_auth_at")
      .eq("team_id", teamId)
      .maybeSingle();
    if (data) {
      ssoConfig = {
        idp_metadata_url: data.idp_metadata_url ?? null,
        connection_status:
          (data.connection_status as "connected" | "disconnected" | null) ??
          null,
        last_auth_at: data.last_auth_at ?? null,
      };
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.kova.dev";
  const entityId = `${appUrl}/api/sso/metadata`;
  const acsUrl = `${appUrl}/api/sso/acs`;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">SSO / SAML</h1>
        <p className="text-sm text-kova-silver-dim mt-0.5">
          Configure single sign-on for your organization
        </p>
      </div>

      <section className="bg-kova-surface border border-kova-border rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-5">
          SAML Configuration
        </h2>
        <SsoSettingsForm
          isEnterprise={isEnterprise}
          entityId={entityId}
          acsUrl={acsUrl}
          currentIdpMetadataUrl={ssoConfig?.idp_metadata_url}
          connectionStatus={
            ssoConfig?.connection_status ??
            (isEnterprise ? "disconnected" : null)
          }
          lastAuthAt={ssoConfig?.last_auth_at}
        />
      </section>

      {isEnterprise && (
        <section className="mt-4 bg-kova-surface border border-kova-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-3">
            Setup Instructions
          </h2>
          <ol className="space-y-3 text-sm">
            {[
              "Copy the ACS URL and Entity ID above into your Identity Provider (Okta, Azure AD, Google Workspace, etc).",
              "Download or copy your IdP SAML metadata XML URL.",
              "Paste the metadata URL into the form above and save.",
              "Test authentication by signing out and signing back in via SSO.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-kova-blue/20 text-kova-blue text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-kova-silver">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
