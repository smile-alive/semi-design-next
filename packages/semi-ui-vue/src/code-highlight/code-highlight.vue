<script setup lang="ts">
    import { computed, toRaw } from 'vue';
    import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
    import { cssClasses } from '@fibrae/semi-foundation/code-highlight/constants';
    import CodeHighlightFoundation, { type CodeHighlightAdapter, type CodeHighlightBaseState } from '@fibrae/semi-foundation/code-highlight/index';
    import type { LanguageInput } from '@fibrae/semi-foundation/code-highlight/registry';
    import '@fibrae/semi-foundation/code-highlight/code-highlight.scss';
    import type { ElementProps } from '../_base/element-props';
    import { groupRole } from '../_base/group-role';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import type { CodeHighlightProps } from './interface';

    type Foundation = CodeHighlightFoundation<CodeHighlightProps>;
    type Adapter = CodeHighlightAdapter<CodeHighlightProps>;

    const props = withDefaults(defineProps<CodeHighlightProps & /* @vue-ignore */ ElementProps<'div', keyof CodeHighlightProps>>(), {
        code: semiGlobalDefault('CodeHighlight', 'code'),
        languages: semiGlobalDefault('CodeHighlight', 'languages'),
        lineNumber: () => semiDefault('CodeHighlight', 'lineNumber', true),
        themes: semiGlobalDefault('CodeHighlight', 'themes'),
    });

    const { state } = useFoundation<Foundation, Adapter, CodeHighlightProps, CodeHighlightBaseState>(
        CodeHighlightFoundation,
        props,
        () => CodeHighlightFoundation.getInitialState(),
        () => ({}),
        // the loaders and themes are plain data for shiki, which must not see them wrapped in reactive proxies
        {
            props: {
                // Naming LanguageInput in this file lets the emitted declaration import it from the foundation module.
                // Otherwise declaration emit names shiki's internal @shikijs/types, which this package cannot resolve,
                // and the pack bundles a copy of its declarations that user-loaded shiki grammars do not match.
                languages: (): LanguageInput[] | undefined => toRaw(props.languages),
                themes: () => toRaw(props.themes),
            },
        }
    );

    const html = computed(() => (state.value.highlightedCode === (props.code ?? '') ? state.value.html : ''));
    const rootClass = computed(() => [cssClasses.PREFIX, `${BASE_CLASS_PREFIX}-scrollbar`, { [`${cssClasses.PREFIX}-lineNumber`]: props.lineNumber }]);

    // The markup in `html` comes from Shiki, which escapes the code text, so v-html only carries its own spans.
</script>

<template>
    <div v-if="html" :class="rootClass" :role="groupRole($attrs)" v-html="html" />
    <div v-else :class="rootClass" :role="groupRole($attrs)">
        <pre><code>{{ props.code }}</code></pre>
    </div>
</template>
