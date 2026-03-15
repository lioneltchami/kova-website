// @ts-nocheck
import { default as __fd_glob_26 } from "../content/docs/meta.json?collection=meta"
import * as __fd_glob_25 from "../content/docs/reference/plan-format.mdx?collection=docs"
import * as __fd_glob_24 from "../content/docs/reference/kova-yaml.mdx?collection=docs"
import * as __fd_glob_23 from "../content/docs/reference/checkpoint-format.mdx?collection=docs"
import * as __fd_glob_22 from "../content/docs/reference/agent-types.mdx?collection=docs"
import * as __fd_glob_21 from "../content/docs/getting-started/quickstart.mdx?collection=docs"
import * as __fd_glob_20 from "../content/docs/getting-started/installation.mdx?collection=docs"
import * as __fd_glob_19 from "../content/docs/getting-started/configuration.mdx?collection=docs"
import * as __fd_glob_18 from "../content/docs/guides/webhook-notifications.mdx?collection=docs"
import * as __fd_glob_17 from "../content/docs/guides/token-tracking.mdx?collection=docs"
import * as __fd_glob_16 from "../content/docs/guides/plan-templates.mdx?collection=docs"
import * as __fd_glob_15 from "../content/docs/guides/model-tiering.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/guides/interactive-mode.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/guides/github-integration.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/guides/cross-platform.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/guides/checkpoint-recovery.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/commands/update.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/commands/team-build.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/commands/status.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/commands/run.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/commands/pr.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/commands/plan.mdx?collection=docs"
import * as __fd_glob_4 from "../content/docs/commands/init.mdx?collection=docs"
import * as __fd_glob_3 from "../content/docs/commands/config.mdx?collection=docs"
import * as __fd_glob_2 from "../content/docs/commands/completions.mdx?collection=docs"
import * as __fd_glob_1 from "../content/docs/commands/build.mdx?collection=docs"
import * as __fd_glob_0 from "../content/docs/index.mdx?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.doc("docs", "content/docs", {"index.mdx": __fd_glob_0, "commands/build.mdx": __fd_glob_1, "commands/completions.mdx": __fd_glob_2, "commands/config.mdx": __fd_glob_3, "commands/init.mdx": __fd_glob_4, "commands/plan.mdx": __fd_glob_5, "commands/pr.mdx": __fd_glob_6, "commands/run.mdx": __fd_glob_7, "commands/status.mdx": __fd_glob_8, "commands/team-build.mdx": __fd_glob_9, "commands/update.mdx": __fd_glob_10, "guides/checkpoint-recovery.mdx": __fd_glob_11, "guides/cross-platform.mdx": __fd_glob_12, "guides/github-integration.mdx": __fd_glob_13, "guides/interactive-mode.mdx": __fd_glob_14, "guides/model-tiering.mdx": __fd_glob_15, "guides/plan-templates.mdx": __fd_glob_16, "guides/token-tracking.mdx": __fd_glob_17, "guides/webhook-notifications.mdx": __fd_glob_18, "getting-started/configuration.mdx": __fd_glob_19, "getting-started/installation.mdx": __fd_glob_20, "getting-started/quickstart.mdx": __fd_glob_21, "reference/agent-types.mdx": __fd_glob_22, "reference/checkpoint-format.mdx": __fd_glob_23, "reference/kova-yaml.mdx": __fd_glob_24, "reference/plan-format.mdx": __fd_glob_25, });

export const meta = await create.meta("meta", "content/docs", {"meta.json": __fd_glob_26, });