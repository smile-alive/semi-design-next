<script lang="ts">
    import { Select, type SelectOptionProps, type SelectProps, type SelectValue } from '..';

    type Mode = 'bind' | 'function' | 'one-way' | 'uncontrolled';

    interface Store {
        value?: SelectValue;
        accept: boolean;
        log: string[];
        optionList: SelectOptionProps[];
    }

    let { mode = 'uncontrolled', store, props = {} }: { mode?: Mode; store: Store; props?: Omit<SelectProps, 'value' | 'optionList'> } = $props();

    let select = $state<Select>();

    const log = (entry: string) => {
        store.log.push(entry);
    };

    const common = $derived({
        motion: false,
        'aria-label': 'Fruit',
        ...props,
        optionList: store.optionList,
        onChange: (value: SelectValue) => {
            log(`change ${JSON.stringify(value)}`);
            props.onChange?.(value);
        },
    });

    export function api() {
        return select;
    }
</script>

{#if mode === 'bind'}
    <Select bind:this={select} bind:value={store.value} {...common} />
{:else if mode === 'function'}
    <Select
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
    <Select bind:this={select} value={store.value} {...common} />
{:else}
    <Select bind:this={select} {...common} />
{/if}
