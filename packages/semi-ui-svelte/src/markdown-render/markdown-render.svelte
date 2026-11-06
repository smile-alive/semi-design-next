<script lang="ts">
    import { omitBy } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
    import MarkdownRenderFoundation, { type MarkdownRenderAdapter, type MarkdownRenderBaseProps, type MarkdownRenderBaseState } from '@fibrae/semi-foundation/markdown-render/foundation';
    import { isDev } from '@fibrae/semi-foundation/utils/warning';
    import '@fibrae/semi-foundation/markdown-render/markdown-render.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import * as defaultComponents from './components/index.js';
    import type { MarkdownRenderProps } from './interface.js';
    import MarkdownChildren from './markdown-children.svelte';
    import runtime from './runtime.js';

    type Foundation = MarkdownRenderFoundation<MarkdownRenderBaseProps>;
    type Adapter = MarkdownRenderAdapter<MarkdownRenderBaseProps>;

    const defaults = useDefaultProps('MarkdownRender');
    let { raw, components = defaults('components'), format = defaults('format', 'mdx'), remarkPlugins = defaults('remarkPlugins'), rehypePlugins = defaults('rehypePlugins'), remarkGfm = defaults('remarkGfm', true), ...rest }: MarkdownRenderProps = $props();

    const foundationProps: MarkdownRenderBaseProps = {
        get raw() {
            return raw;
        },
        get format() {
            return format;
        },
        get remarkPlugins() {
            return remarkPlugins;
        },
        get rehypePlugins() {
            return rehypePlugins;
        },
        get remarkGfm() {
            return remarkGfm;
        },
    };

    const { states } = useFoundation<Foundation, Adapter, MarkdownRenderBaseProps, MarkdownRenderBaseState>(
        MarkdownRenderFoundation,
        foundationProps,
        (view) => MarkdownRenderFoundation.getInitialState(view, runtime),
        () => ({
            getRuntime: () => runtime,
            notifyCompileError: (error) => {
                if (isDev()) {
                    console.error(error);
                }
            },
        })
    );

    const role = $derived(rest.role ?? (rest['aria-label'] || rest['aria-labelledby'] ? 'group' : undefined));
    const renderContent = $derived(states().renderContent);

    // an explicit undefined would replace a default, and the runtime takes it for an element type
    const merged = $derived({ ...defaultComponents, ...omitBy(components ?? {}, (component) => component === undefined) });
    const tree = $derived(renderContent?.({ components: merged }));
</script>

<div {...rest} class={[cssClasses.PREFIX, rest.class]} {role}>
    <MarkdownChildren content={tree} />
</div>
