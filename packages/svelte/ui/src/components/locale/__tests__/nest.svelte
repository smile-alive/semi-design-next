<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import { ConfigProvider } from '../../config-provider';
    import LocaleProvider from '../locale-provider.svelte';
    import Nest from './nest.svelte';

    export interface Layer {
        kind: 'locale' | 'config';
        locale?: Locale | null;
    }

    let { chain, children }: { chain: Layer[]; children: Snippet } = $props();

    const head = $derived(chain[0]);
    const tail = $derived(chain.slice(1));
</script>

<!-- wraps `children` in the providers of `chain`, outermost first -->
{#if !head}
    {@render children()}
{:else if head.kind === 'locale'}
    <LocaleProvider locale={head.locale}><Nest chain={tail} {children} /></LocaleProvider>
{:else}
    <ConfigProvider locale={head.locale}><Nest chain={tail} {children} /></ConfigProvider>
{/if}
