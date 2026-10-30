<script lang="ts">
    import { Input } from '@fibrae/semi-ui-svelte';
</script>

<Input aria-label="域名">
    {#snippet addonBefore()}http://{/snippet}
    {#snippet addonAfter()}.com{/snippet}
</Input>
