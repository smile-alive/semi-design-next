<script lang="ts">
    import type { TreeSelectSpecProps } from '@test/specs/tree-select';
    import { ConfigProvider } from '../../config-provider';
    import { TreeSelect } from '../index';
    import type { TreeSelectValue } from '../interface';

    let { store }: { store: TreeSelectSpecProps } = $props();

    const rest = $derived.by(() => {
        const { direction, value, defaultValue, expandedKeys, ...others } = store;
        return others;
    });
    // Svelte has no `defaultValue`, and a one-way `value` or `expandedKeys` can be overridden by the component: the spec's
    // default is the binding's initial value and its controlled values go through function bindings that reject writes
    // svelte-ignore state_referenced_locally
    let chosenValue = $state<TreeSelectValue | undefined>(store.defaultValue);
    let chosenExpandedKeys = $state<string[] | undefined>();
</script>

<ConfigProvider direction={store.direction}>
    <TreeSelect
        bind:expandedKeys={
            () => (store.expandedKeys === undefined ? chosenExpandedKeys : store.expandedKeys),
            (keys) => {
                chosenExpandedKeys = keys;
            }
        }
        bind:value={
            () => (store.value === undefined ? chosenValue : store.value),
            (next) => {
                chosenValue = next;
            }
        }
        motion={false}
        motionExpand={false}
        {...rest}
    />
</ConfigProvider>
