/** A compiled element: `type` is a tag name, a component, or `Fragment` */
export interface MarkdownNode {
    type: string | symbol | ((...args: any[]) => unknown);
    props: { children?: MarkdownChild } & Record<string, unknown>;
}

export type MarkdownChild = MarkdownNode | string | number | boolean | null | undefined | MarkdownChild[];

export const Fragment = Symbol('MarkdownRender.Fragment');

// Svelte has no JSX runtime, so the compiled source yields a plain node tree that markdown-render.svelte renders.
function jsx(type: MarkdownNode['type'], props: Record<string, unknown>) {
    // MDX hands a `components.wrapper` its content as the element `<_createMdxContent />`, a plain function that is
    // not a Svelte component; calling it yields the content tree. Known limit: relies on the name @mdx-js/mdx emits.
    if (typeof type === 'function' && type.name === '_createMdxContent') return type(props) as MarkdownNode;
    const { className, ...rest } = props;
    // MDX authors write className, which Svelte spreads as an unknown attribute instead of the class
    if (className !== undefined) rest.class = rest.class === undefined ? className : `${className} ${rest.class}`;
    return { type, props: rest as MarkdownNode['props'] };
}

export function isNode(child: MarkdownChild): child is MarkdownNode {
    return typeof child === 'object' && child !== null && !Array.isArray(child);
}

// Svelte rejects content inside these elements
export const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

// stylePropertyNameCase 'css' hands style over as `{ 'text-align': 'center' }`, which markdown-render.svelte joins into a
// string because Svelte accepts no style object
export default { Fragment, jsx, jsxs: jsx, elementAttributeNameCase: 'html' as const, stylePropertyNameCase: 'css' as const };
