<script lang="ts">
    import en_US from '@fibrae/semi-foundation/locale/source/en_US';
    import { TreeSelect, type TreeSelectHandle, type TreeSelectProps, type TreeSelectValue } from '..';
    import ConfigProvider from '../../config-provider/config-provider.svelte';

    type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';

    interface Store {
        value?: TreeSelectValue;
        expandedKeys?: string[];
        accept: boolean;
        log: string[];
        props?: TreeSelectProps;
    }

    let { mode = 'uncontrolled', store, props = {}, direction }: { mode?: Mode; store: Store; props?: Omit<TreeSelectProps, 'value' | 'expandedKeys'>; direction?: 'ltr' | 'rtl' } = $props();

    let select = $state<TreeSelectHandle>();

    const log = (entry: string) => {
        store.log.push(entry);
    };

    // `store.props` lets a test change the props after mount
    const common = $derived({
        motion: false,
        motionExpand: false,
        'aria-label': 'Region',
        ...props,
        ...store.props,
        onChange: (value: TreeSelectValue | undefined, ...rest: unknown[]) => {
            log(`change ${JSON.stringify(value)}`);
            (props.onChange as ((...args: unknown[]) => void) | undefined)?.(value, ...rest);
        },
        onExpand: (keys: string[], info: { expanded: boolean }) => {
            log(`expand ${keys.join()}`);
            props.onExpand?.(keys, info as Parameters<NonNullable<TreeSelectProps['onExpand']>>[1]);
        },
    });

    export function api() {
        return select;
    }
</script>

<ConfigProvider {direction} locale={en_US}>
    {#if mode === 'bind'}
        <TreeSelect bind:expandedKeys={store.expandedKeys} bind:this={select} bind:value={store.value} {...common} />
    {:else if mode === 'function'}
        <TreeSelect
            bind:expandedKeys={
                () => store.expandedKeys,
                (keys) => {
                    log(`set keys ${keys?.join()}`);
                    if (store.accept) store.expandedKeys = keys;
                }
            }
            bind:this={select}
            bind:value={
                () => store.value,
                (value) => {
                    log(`set ${JSON.stringify(value)}`);
                    if (store.accept) store.value = value;
                }
            }
            {...common}
        />
    {:else if mode === 'one-way'}
        <TreeSelect bind:this={select} expandedKeys={store.expandedKeys} value={store.value} {...common} />
    {:else}
        <TreeSelect bind:this={select} {...common} />
    {/if}
</ConfigProvider>
