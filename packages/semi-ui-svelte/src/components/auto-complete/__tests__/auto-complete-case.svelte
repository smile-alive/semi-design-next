<script lang="ts">
    import { AutoComplete, type AutoCompleteItems, type AutoCompleteProps } from '..';

    type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';

    interface Store {
        value?: string | number;
        accept: boolean;
        log: string[];
        data: AutoCompleteItems[];
    }

    let { mode = 'uncontrolled', store, props = {} }: { mode?: Mode; store: Store; props?: Omit<AutoCompleteProps, 'value' | 'data'> } = $props();

    let autoComplete = $state<ReturnType<typeof AutoComplete>>();

    const log = (entry: string) => {
        store.log.push(entry);
    };

    const common = $derived({
        motion: false,
        'aria-label': 'City',
        ...props,
        onChange: (value: string | number) => {
            log(`change ${JSON.stringify(value)}`);
            props.onChange?.(value);
        },
    });

    export function api() {
        return autoComplete;
    }
</script>

{#if mode === 'bind'}
    <AutoComplete bind:this={autoComplete} bind:value={store.value} {...common} data={store.data} />
{:else if mode === 'function'}
    <AutoComplete
        bind:this={autoComplete}
        bind:value={
            () => store.value,
            (value) => {
                log(`set ${JSON.stringify(value)}`);
                if (store.accept) store.value = value;
            }
        }
        {...common}
        data={store.data}
    />
{:else if mode === 'one-way'}
    <AutoComplete bind:this={autoComplete} value={store.value} {...common} data={store.data} />
{:else}
    <AutoComplete bind:this={autoComplete} {...common} data={store.data} />
{/if}
