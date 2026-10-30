<script lang="ts">
    import { IconMinus, IconPlus } from '@fibrae/semi-icons-svelte';
    import Collapse from '../collapse.svelte';
    import type { CollapseProps } from '../interface';
    import CollapsePanel from '../panel.svelte';

    interface HostStore {
        mode?: 'bind' | 'function' | 'one-way' | 'uncontrolled';
        // a function binding's setter writes the value to `activeKey` only when true
        accept?: boolean;
        activeKey?: CollapseProps['activeKey'];
        collapse?: Omit<CollapseProps, 'activeKey' | 'onChange' | 'children' | 'expandIcon' | 'collapseIcon'>;
        // the first panel's own options
        panel?: { disabled?: boolean; extra?: string; showArrow?: boolean; class?: string; style?: string; 'data-testid'?: string };
        icons?: boolean;
        log: string[];
    }

    let { store }: { store: HostStore } = $props();

    const mode = $derived(store.mode ?? 'uncontrolled');
    const change = (activeKey: string[], event: MouseEvent) => {
        store.log.push(`change ${activeKey.join(',')} ${event.type}`);
    };
</script>

{#snippet plus()}<IconPlus />{/snippet}
{#snippet minus()}<IconMinus />{/snippet}
{#snippet body()}<p>Hi, bytedance dance dance. This is the docsite of Semi UI.</p>{/snippet}
{#snippet extra()}{store.panel?.extra}{/snippet}
{#snippet panels()}
    <CollapsePanel class={store.panel?.class} data-testid={store.panel?.['data-testid']} disabled={store.panel?.disabled} extra={store.panel?.extra === undefined ? undefined : extra} itemKey="1" showArrow={store.panel?.showArrow} style={store.panel?.style}>
        {#snippet header()}This is panel header 1{/snippet}
        {@render body()}
    </CollapsePanel>
    <CollapsePanel itemKey="2">
        {#snippet header()}This is panel header 2{/snippet}
        {@render body()}
    </CollapsePanel>
    <CollapsePanel itemKey="3">
        {#snippet header()}This is panel header 3{/snippet}
        {@render body()}
    </CollapsePanel>
{/snippet}

{#if mode === 'bind'}
    <Collapse {...store.collapse} bind:activeKey={store.activeKey} collapseIcon={store.icons ? minus : undefined} expandIcon={store.icons ? plus : undefined} onChange={change}>
        {@render panels()}
    </Collapse>
{:else if mode === 'function'}
    <Collapse
        {...store.collapse}
        bind:activeKey={
            () => store.activeKey,
            (value) => {
                store.log.push(`set ${value?.toString()}`);
                if (store.accept) store.activeKey = value;
            }
        }
        collapseIcon={store.icons ? minus : undefined}
        expandIcon={store.icons ? plus : undefined}
        onChange={change}
    >
        {@render panels()}
    </Collapse>
{:else if mode === 'one-way'}
    <Collapse {...store.collapse} activeKey={store.activeKey} collapseIcon={store.icons ? minus : undefined} expandIcon={store.icons ? plus : undefined} onChange={change}>
        {@render panels()}
    </Collapse>
{:else}
    <Collapse {...store.collapse} collapseIcon={store.icons ? minus : undefined} expandIcon={store.icons ? plus : undefined} onChange={change}>
        {@render panels()}
    </Collapse>
{/if}
