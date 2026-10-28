<script setup lang="ts">
    import { computed, onMounted } from 'vue';
    import { omitBy } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
    import MarkdownRenderFoundation, { type MarkdownRenderAdapter, type MarkdownRenderBaseState } from '@fibrae/semi-foundation/markdown-render/foundation';
    import { isDev } from '@fibrae/semi-foundation/utils/warning';
    import '@fibrae/semi-foundation/markdown-render/markdown-render.scss';
    import type { ElementProps } from '../_base/element-props';
    import { groupRole } from '../_base/group-role';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import useDidUpdate from '../_base/use-did-update';
    import useFoundation from '../_base/use-foundation';
    import * as defaultComponents from './components';
    import type { MarkdownRenderProps } from './interface';
    import runtime from './runtime';

    type Foundation = MarkdownRenderFoundation<MarkdownRenderProps>;
    type Adapter = MarkdownRenderAdapter<MarkdownRenderProps>;

    const props = withDefaults(defineProps<MarkdownRenderProps & /* @vue-ignore */ ElementProps<'div', keyof MarkdownRenderProps>>(), {
        components: semiGlobalDefault('MarkdownRender', 'components'),
        format: () => semiDefault('MarkdownRender', 'format', 'mdx'),
        rehypePlugins: semiGlobalDefault('MarkdownRender', 'rehypePlugins'),
        remarkGfm: () => semiDefault('MarkdownRender', 'remarkGfm', true),
        remarkPlugins: semiGlobalDefault('MarkdownRender', 'remarkPlugins'),
    });

    const { foundation, state } = useFoundation<Foundation, Adapter, MarkdownRenderProps, MarkdownRenderBaseState>(
        MarkdownRenderFoundation,
        props,
        // md compiles synchronously, so the server HTML and the first client render already hold the content
        () => ({ renderContent: MarkdownRenderFoundation.compileMdSync(props, runtime) }),
        () => ({
            getRuntime: () => runtime,
            notifyCompileError: (error) => {
                if (isDev()) {
                    console.error(error);
                }
            },
        })
    );

    // an explicit undefined would replace a default
    const components = computed(() => ({ ...defaultComponents, ...omitBy(props.components ?? {}, (component) => component === undefined) }));

    // mdx, and md that compileMdSync could not finish, compile after mount; the server renders their root empty
    onMounted(() => {
        if (!state.value.renderContent) void foundation.updateContent();
    });

    useDidUpdate(
        () => [props.raw, props.format, props.remarkGfm, props.remarkPlugins, props.rehypePlugins] as const,
        () => void foundation.updateContent(),
        // an inline plugin array is new on every render, so compare entries
        (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && MarkdownRenderFoundation.isSamePluginList(a[3], b[3]) && MarkdownRenderFoundation.isSamePluginList(a[4], b[4]),
        'pre'
    );
</script>

<template>
    <div :class="cssClasses.PREFIX" :role="groupRole($attrs)">
        <!-- each compile yields a new function, which as a component type would remount the subtree; known limit:
             `components.wrapper` still remounts the content on each compile -->
        <component :is="state.renderContent({ components })" v-if="state.renderContent" />
    </div>
</template>
