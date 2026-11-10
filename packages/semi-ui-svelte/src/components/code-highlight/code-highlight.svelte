<script lang="ts">
    import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
    import { cssClasses } from '@fibrae/semi-foundation/components/code-highlight/constants';
    import CodeHighlightFoundation, { type CodeHighlightAdapter, type CodeHighlightBaseProps, type CodeHighlightBaseState } from '@fibrae/semi-foundation/components/code-highlight/index';
    import { namedRole } from '@fibrae/semi-foundation/utils/a11y';
    import '@fibrae/semi-foundation/components/code-highlight/code-highlight.scss';
    import useDefaultProps from '../../base/use-default-props.js';
    import useFoundation from '../../base/use-foundation.svelte.js';
    import type { CodeHighlightProps } from './interface.js';

    type Foundation = CodeHighlightFoundation<CodeHighlightBaseProps>;
    type Adapter = CodeHighlightAdapter<CodeHighlightBaseProps>;

    const defaults = useDefaultProps('CodeHighlight');
    const { code = defaults('code'), language, lineNumber = defaults('lineNumber', true), languages = defaults('languages'), themes = defaults('themes'), ...rest }: CodeHighlightProps = $props();

    const foundationProps: CodeHighlightBaseProps = {
        get code() {
            return code;
        },
        get language() {
            return language;
        },
        get languages() {
            return languages;
        },
        get themes() {
            return themes;
        },
    };

    const { states } = useFoundation<Foundation, Adapter, CodeHighlightBaseProps, CodeHighlightBaseState>(
        CodeHighlightFoundation,
        foundationProps,
        () => CodeHighlightFoundation.getInitialState(),
        () => ({})
    );

    const html = $derived(CodeHighlightFoundation.getVisibleHtml(states(), code));
    const role = $derived(namedRole(rest));
</script>

{#if html}
    <!-- The markup comes from Shiki, which escapes the code text, so it only carries its own spans -->
    <div {...rest} class={[cssClasses.PREFIX, `${BASE_CLASS_PREFIX}-scrollbar`, rest.class, { [`${cssClasses.PREFIX}-lineNumber`]: lineNumber }]} {role}>
        {@html html}
    </div>
{:else}
    <div {...rest} class={[cssClasses.PREFIX, `${BASE_CLASS_PREFIX}-scrollbar`, rest.class, { [`${cssClasses.PREFIX}-lineNumber`]: lineNumber }]} {role}>
        <pre><code>{code}</code></pre>
    </div>
{/if}
