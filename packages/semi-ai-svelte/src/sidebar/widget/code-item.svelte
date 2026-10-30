<script lang="ts">
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import CodeHighlight from '@fibrae/semi-ui-svelte/code-highlight/code-highlight.svelte';
    import JsonViewer from '@fibrae/semi-ui-svelte/json-viewer/json-viewer.svelte';
    import type { CodeItemProps } from './interface.js';

    // name is read by the owner, which lists it in the panel header
    let { name: _name, language, content, isJson = false, jsonViewerProps, codeHighlightProps, customRender, searchButton, ...rest }: CodeItemProps = $props();

    const prefix = cssClasses.SIDEBAR;
</script>

<div {...rest} class={[`${prefix}-code-content`, rest.class]}>
    {#if isJson}
        <JsonViewer height="100%" options={strings.JSON_VIEWER_OPTIONS} showSearch={false} value={content} width="100%" {...jsonViewerProps} customRender={customRender ?? jsonViewerProps?.customRender} searchButton={searchButton ?? jsonViewerProps?.searchButton} />
    {:else}
        <CodeHighlight code={content} language={language ?? ''} {...codeHighlightProps} />
    {/if}
</div>
