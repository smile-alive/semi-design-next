<script lang="ts">
    import FloatButtonGroup from '../float-button-group.svelte';
    import type { FloatButtonGroupItem, FloatButtonGroupItemSnippetArgs } from '../interface';

    let items = $state<FloatButtonGroupItem[]>([{ content: 'Editor', value: 'editor' }]);
    const add = () => items.push({ content: 'Search', value: 'search' });
    const disableFirst = () => {
        items[0].disabled = true;
    };
    const removeFirst = () => items.shift();
</script>

{#snippet icon({ item, index }: FloatButtonGroupItemSnippetArgs)}<i data-icon={`${index}:${item.value}`}></i>{/snippet}

<button type="button" onclick={add}>add</button>
<button type="button" onclick={disableFirst}>disable</button>
<button type="button" onclick={removeFirst}>remove</button>
<FloatButtonGroup {icon} {items} />
