<script lang="ts">
    import { IconAlertCircle, IconHelpCircle, IconMinusCircle, IconPlus, IconPlusCircle, IconRefresh, IconSearch, type IconSize } from '@fibrae/semi-icons-svelte';

    const icons = [IconSearch, IconHelpCircle, IconAlertCircle, IconMinusCircle, IconPlusCircle, IconPlus, IconRefresh];
    const sizes: IconSize[] = ['extra-small', 'small', 'default', 'large', 'extra-large'];
</script>

{#each icons as Icon, index (index)}
    <div style="margin-block-end: 4px">
        {#each sizes as size (size)}
            <Icon {size} />
        {/each}
    </div>
{/each}
