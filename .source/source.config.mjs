// source.config.ts
import { rehypeCode } from "fumadocs-core/mdx-plugins";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
var { docs, meta } = defineDocs({
  dir: "content/docs"
});
var source_config_default = defineConfig({
  mdxOptions: {
    rehypePlugins: [rehypeCode]
  }
});
export {
  source_config_default as default,
  docs,
  meta
};
