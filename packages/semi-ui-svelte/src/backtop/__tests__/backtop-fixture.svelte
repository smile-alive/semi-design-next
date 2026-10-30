<script lang="ts">
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import LocaleProvider from '../../locale/locale-provider.svelte';
    import BackTop from '../backtop.svelte';
    import type { BackTopProps } from '../interface';

    // the snippets are passed only when their flag is on, so absence stays observable; `locale` wraps the button in a LocaleProvider
    let { store }: { store: { props?: BackTopProps; icon?: boolean; badgeCount?: boolean; children?: string; locale?: Locale } } = $props();
</script>

{#snippet icon()}<i data-testid="icon"></i>{/snippet}
{#snippet badgeCount()}<b data-testid="count">new</b>{/snippet}
{#snippet children()}<span class="custom">{store.children}</span>{/snippet}

{#snippet button()}
    <BackTop {...store.props} badgeCount={store.badgeCount ? badgeCount : undefined} children={store.children === undefined ? undefined : children} icon={store.icon ? icon : undefined} />
{/snippet}

{#if store.locale}
    <LocaleProvider locale={store.locale}>
        {@render button()}
    </LocaleProvider>
{:else}
    {@render button()}
{/if}
