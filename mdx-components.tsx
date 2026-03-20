import defaultComponents from "fumadocs-ui/mdx";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MDXComponents = Record<string, any>;

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...defaultComponents,
    ...components,
  };
}
