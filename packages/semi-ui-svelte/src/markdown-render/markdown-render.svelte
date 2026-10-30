<script lang="ts">
    import { onMount } from 'svelte';
    import { omitBy } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
    import MarkdownRenderFoundation, { type MarkdownRenderAdapter, type MarkdownRenderBaseProps, type MarkdownRenderBaseState } from '@fibrae/semi-foundation/markdown-render/foundation';
    import { isDev } from '@fibrae/semi-foundation/utils/warning';
    import '@fibrae/semi-foundation/markdown-render/markdown-render.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
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

    const { foundation, states } = useFoundation<Foundation, Adapter, MarkdownRenderBaseProps, MarkdownRenderBaseState>(
        MarkdownRenderFoundation,
        foundationProps,
        // md compiles synchronously, so the server HTML and the first client render already hold the content
        (view) => ({ renderContent: MarkdownRenderFoundation.compileMdSync(view, runtime) }),
        () => ({
            getRuntime: () => runtime,
            notifyCompileError: (error) => {
                if (isDev()) {
                    console.error(error);
                }
            },
        })
    );

    // An explicit role wins; a named div is a group.
    const role = $derived(rest.role ?? (rest['aria-label'] || rest['aria-labelledby'] ? 'group' : undefined));
    const renderContent = $derived(states().renderContent);

    // an explicit undefined would replace a default, and the runtime takes it for an element type
    const merged = $derived({ ...defaultComponents, ...omitBy(components ?? {}, (component) => component === undefined) });
    const tree = $derived(renderContent?.({ components: merged }));

    const compileSources = () => [raw, format, remarkGfm, remarkPlugins, rehypePlugins] as const;

    let compiled = compileSources();

    // mdx, and md that compileMdSync could not finish, compile after mount; the server renders their root empty
    onMount(() => {
        if (!states().renderContent) void foundation.updateContent();
    });

    watch(compileSources, (next) => {
        // an inline plugin array is new on every parent render, so compare entries
        const same = next[0] === compiled[0] && next[1] === compiled[1] && next[2] === compiled[2] && MarkdownRenderFoundation.isSamePluginList(next[3], compiled[3]) && MarkdownRenderFoundation.isSamePluginList(next[4], compiled[4]);
        compiled = next;
        if (!same) void foundation.updateContent();
    });
</script>

<div {...rest} class={[cssClasses.PREFIX, rest.class]} {role}>
    <MarkdownChildren content={tree} />
</div>
