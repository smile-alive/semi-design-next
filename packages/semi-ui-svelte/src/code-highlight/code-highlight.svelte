<script lang="ts">
    import { onMount } from 'svelte';
    import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
    import { cssClasses } from '@fibrae/semi-foundation/code-highlight/constants';
    import CodeHighlightFoundation, { type CodeHighlightAdapter, type CodeHighlightBaseProps, type CodeHighlightBaseState } from '@fibrae/semi-foundation/code-highlight/index';
    import { getVersion, subscribe } from '@fibrae/semi-foundation/code-highlight/registry';
    import '@fibrae/semi-foundation/code-highlight/code-highlight.scss';
    import { groupRole } from '../_base/group-role.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import type { CodeHighlightProps } from './interface.js';

    type Foundation = CodeHighlightFoundation<CodeHighlightBaseProps>;
    type Adapter = CodeHighlightAdapter<CodeHighlightBaseProps>;

    const defaults = useDefaultProps('CodeHighlight');
    const { code = defaults('code'), language, lineNumber = defaults('lineNumber', true), languages = defaults('languages'), themes = defaults('themes'), ...rest }: CodeHighlightProps = $props();

    // A registration made after this block mounted (an app entry module that loads later) highlights it again.
    // Subscribing in onMount keeps the server render plain text and free of subscriptions.
    let registered = $state(getVersion());

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

    const { foundation, states } = useFoundation<Foundation, Adapter, CodeHighlightBaseProps, CodeHighlightBaseState>(
        CodeHighlightFoundation,
        foundationProps,
        () => ({ html: '', highlightedCode: '' }),
        (base) => ({ setHtml: (html, highlightedCode) => base.setState({ html, highlightedCode }) })
    );

    // markup for earlier code would lag behind a streaming `code`, so it only shows while it matches
    const html = $derived(states().highlightedCode === (code ?? '') ? states().html : '');
    const role = $derived(groupRole(rest));

    // Not on mount: the effect does not run on the server, where loading shiki is pointless.
    watch(
        () => [code, language, languages, themes, registered],
        () => void foundation.highlightCode()
    );

    onMount(() => {
        registered = getVersion();
        const unsubscribe = subscribe(() => (registered = getVersion()));
        void foundation.highlightCode();
        return unsubscribe;
    });
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
