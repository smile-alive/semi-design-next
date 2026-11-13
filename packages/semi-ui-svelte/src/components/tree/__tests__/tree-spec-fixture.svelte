<script lang="ts">
    import type { TreeSpecProps } from '@test/specs/tree';
    import { ConfigProvider } from '../../config-provider';
    import { Tree } from '../index';
    import type { TreeLabelSnippetProps } from '../interface';

    let { store }: { store: TreeSpecProps } = $props();

    const rest = $derived.by(() => {
        const { direction, labelButtons, onLabelButtonPress, value, defaultValue, expandedKeys, defaultExpandedKeys, ...others } = store;
        return others;
    });
    // Svelte has no `defaultValue` or `defaultExpandedKeys`, and a one-way `value` or `expandedKeys` can be overridden by the tree:
    // the spec's defaults are the bindings' initial values and its controlled values go through function bindings that reject writes
    // svelte-ignore state_referenced_locally
    let chosenValue = $state(store.defaultValue);
    // svelte-ignore state_referenced_locally
    let chosenExpandedKeys = $state(store.defaultExpandedKeys);
</script>

{#snippet labelButton({ item, label }: TreeLabelSnippetProps)}
    <button
        type="button"
        onclick={(event) => {
            event.stopPropagation();
            store.onLabelButtonPress?.(item.key);
        }}>{label}</button
    >
{/snippet}

<ConfigProvider direction={store.direction}>
    <Tree
        bind:expandedKeys={
            () => (store.expandedKeys === undefined ? chosenExpandedKeys : store.expandedKeys),
            (keys) => {
                chosenExpandedKeys = keys;
            }
        }
        bind:value={
            () => (store.value === undefined ? chosenValue : store.value),
            (value) => {
                chosenValue = value;
            }
        }
        label={store.labelButtons ? labelButton : undefined}
        motion={false}
        {...rest}
    />
</ConfigProvider>
