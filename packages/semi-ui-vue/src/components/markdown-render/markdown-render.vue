<script setup lang="ts">
    import { computed } from 'vue';
    import { omitBy } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/components/markdown-render/constants';
    import MarkdownRenderFoundation, { type MarkdownRenderAdapter, type MarkdownRenderBaseState } from '@fibrae/semi-foundation/components/markdown-render/foundation';
    import { namedRole } from '@fibrae/semi-foundation/utils/a11y';
    import '@fibrae/semi-foundation/components/markdown-render/markdown-render.scss';
    import type { ElementProps } from '../../base/element-props';
    import semiDefault, { semiGlobalDefault } from '../../base/semi-default';
    import useFoundation from '../../base/use-foundation';
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

    const { state } = useFoundation<Foundation, Adapter, MarkdownRenderProps, MarkdownRenderBaseState>(
        MarkdownRenderFoundation,
        props,
        () => MarkdownRenderFoundation.getInitialState(props, runtime),
        () => ({ getRuntime: () => runtime })
    );

    // an explicit undefined would replace a default
    const components = computed(() => ({ ...defaultComponents, ...omitBy(props.components ?? {}, (component) => component === undefined) }));
</script>

<template>
    <div :class="cssClasses.PREFIX" :role="namedRole($attrs)">
        <!-- each compile yields a new function, which as a component type would remount the subtree; known limit:
             `components.wrapper` still remounts the content on each compile -->
        <component :is="state.renderContent({ components })" v-if="state.renderContent" />
    </div>
</template>
