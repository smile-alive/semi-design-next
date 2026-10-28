<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/highlight/constants';
    import { findAll } from '@fibrae/semi-foundation/highlight/foundation';
    import '@fibrae/semi-foundation/highlight/highlight.scss';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
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
            searchWords: typeof props.searchWords === 'string' ? props.searchWords : props.searchWords.map((word) => (word && typeof word === 'object' ? { text: word.text, className: word.class, style: word.style } : word)),
            caseSensitive: props.caseSensitive,
            autoEscape: props.autoEscape,
        }).map((chunk) => ({ ...chunk, text: props.sourceString.slice(chunk.start, chunk.end) }))
    );
</script>

<template>
    <template v-for="(chunk, index) in chunks" :key="index">
        <component :is="props.component || 'mark'" v-if="chunk.highlight" :class="[`${prefixCls}-tag`, props.highlightClassName, chunk.className]" :style="{ ...props.highlightStyle, ...chunk.style }">
            {{ chunk.text }}
        </component>
        <template v-else>{{ chunk.text }}</template>
    </template>
</template>
