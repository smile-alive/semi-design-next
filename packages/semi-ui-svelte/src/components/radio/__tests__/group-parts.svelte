<script lang="ts">
    import RadioGroup from '../radio-group.svelte';
    import Radio from '../radio.svelte';
</script>

{#snippet label()}A{/snippet}
{#snippet extra()}more{/snippet}

<RadioGroup classNames={{ item: 'g-item', itemIcon: 'g-icon', itemLabel: 'g-label', itemExtra: 'g-extra' }} styles={{ itemIcon: 'order: 1; color: red' }}>
    <Radio children={label} class="own" classNames={{ icon: 'c-icon', label: 'c-label', extra: 'c-extra' }} {extra} styles={{ icon: 'order: 2' }} value="a" />
</RadioGroup>
