<script lang="ts">
    import type { CascaderSpecProps } from '@test/specs/cascader';
    import { Cascader, type CascaderValue } from '..';
    import { ConfigProvider } from '../../config-provider';

    let { store }: { store: CascaderSpecProps } = $props();

    // Svelte has no `defaultValue` and a one-way `value` lets the component override it locally: the spec's default is the
    // binding's initial value and its controlled value goes through a function binding that rejects writes
    // svelte-ignore state_referenced_locally
    let chosen = $state<CascaderValue | undefined>(store.defaultValue);
    const rest = $derived.by(() => {
        const { direction, value, defaultValue, ...others } = store;
        return others;
    });
</script>

<ConfigProvider direction={store.direction}>
    <Cascader
        bind:value={
            () => (store.value === undefined ? chosen : store.value),
            (next) => {
                if (store.value === undefined) chosen = next;
            }
        }
        motion={false}
        {...rest as object}
    />
</ConfigProvider>
