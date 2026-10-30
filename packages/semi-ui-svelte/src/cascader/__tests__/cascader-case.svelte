<script lang="ts">
    import { Cascader, type CascaderChangeValue, type CascaderData, type CascaderProps, type CascaderValue } from '..';

    type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';

    interface Store {
        value?: CascaderValue;
        accept: boolean;
        log: string[];
        treeData: CascaderData[];
    }

    let { mode = 'uncontrolled', store, props = {} }: { mode?: Mode; store: Store; props?: Omit<CascaderProps, 'value' | 'treeData'> } = $props();

    let cascader = $state<Cascader>();

    const log = (entry: string) => {
        store.log.push(entry);
    };

    const common = $derived({
        motion: false,
        'aria-label': 'Region',
        ...props,
        treeData: store.treeData,
        onChange: (value: CascaderChangeValue) => {
            log(`change ${JSON.stringify(value)}`);
            props.onChange?.(value);
        },
    });

    export function api() {
        return cascader;
    }
</script>

{#if mode === 'bind'}
    <Cascader bind:this={cascader} bind:value={store.value} {...common} />
{:else if mode === 'function'}
    <Cascader
        bind:this={cascader}
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
    <Cascader bind:this={cascader} value={store.value} {...common} />
{:else}
    <Cascader bind:this={cascader} {...common} />
{/if}
