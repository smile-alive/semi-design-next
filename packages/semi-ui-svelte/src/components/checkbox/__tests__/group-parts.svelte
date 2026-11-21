<script lang="ts">
    import CheckboxGroup from '../checkbox-group.svelte';
    import Checkbox from '../checkbox.svelte';
</script>

{#snippet label()}A{/snippet}
{#snippet extra()}more{/snippet}

<CheckboxGroup classNames={{ item: 'g-item', itemIcon: 'g-icon', itemLabel: 'g-label', itemExtra: 'g-extra' }} styles={{ itemIcon: 'order: 1; color: red' }}>
    <Checkbox children={label} class="own" classNames={{ icon: 'c-icon', label: 'c-label', extra: 'c-extra' }} {extra} styles={{ icon: 'order: 2' }} value="a" />
</CheckboxGroup>
