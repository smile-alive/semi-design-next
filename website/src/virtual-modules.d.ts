declare module 'virtual:semi-vue-docs' {
    const docs: Record<string, () => Promise<import('astro').MDXInstance<Record<string, unknown>>>>;
    export default docs;
}

declare module 'virtual:semi-solid-docs' {
    const docs: Record<string, () => Promise<import('astro').MDXInstance<Record<string, unknown>>>>;
    export default docs;
}
