<script lang="ts">
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import LocaleProvider from '@fibrae/semi-ui-svelte/locale/locale-provider.svelte';
    import { Annotation, MCPConfigure, Sidebar } from '../index';

    let { locale, kind }: { locale: Locale; kind: 'sidebar' | 'sidebar-code' | 'annotation' | 'mcp' } = $props();
</script>

<LocaleProvider {locale}>
    {#if kind === 'sidebar'}
        <Sidebar motion={false} visible />
    {:else if kind === 'sidebar-code'}
        <Sidebar detailContent={{ name: 'main.js', content: 'const a = 1;' }} mode="code" motion={false} visible />
    {:else if kind === 'annotation'}
        <Annotation motion={false} visible />
    {:else}
        <MCPConfigure motion={false} visible />
    {/if}
</LocaleProvider>
