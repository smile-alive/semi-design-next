<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/highlight/constants';
    import { findAll } from '@fibrae/semi-foundation/components/highlight/foundation';
    import '@fibrae/semi-foundation/components/highlight/highlight.scss';
    import semiDefault, { semiGlobalDefault } from '../../base/semi-default';
    import type { HighlightProps } from './interface';

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<HighlightProps>(), {
        sourceString: () => semiDefault('Highlight', 'sourceString', ''),
        searchWords: () => semiDefault('Highlight', 'searchWords', []),
        caseSensitive: () => semiDefault('Highlight', 'caseSensitive', false),
        autoEscape: () => semiDefault('Highlight', 'autoEscape', true),
        component: () => semiDefault('Highlight', 'component', 'mark'),
        highlightClassName: semiGlobalDefault('Highlight', 'highlightClassName'),
        highlightStyle: semiGlobalDefault('Highlight', 'highlightStyle'),
    });

    const prefixCls = cssClasses.PREFIX;

    // plain-text chunks are never adjacent, so hydration cannot merge their text nodes
    const chunks = computed(() =>
        findAll({
            sourceString: props.sourceString,
            searchWords: props.searchWords,
            caseSensitive: props.caseSensitive,
            autoEscape: props.autoEscape,
        })
    );
</script>

<template>
    <template v-for="(chunk, index) in chunks" :key="index">
        <component :is="props.component || 'mark'" v-if="chunk.highlight" :class="[`${prefixCls}-tag`, props.highlightClassName, chunk.class]" :style="{ ...props.highlightStyle, ...chunk.style }">
            {{ chunk.text }}
        </component>
        <template v-else>{{ chunk.text }}</template>
    </template>
</template>
