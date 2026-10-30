<script lang="ts">
    import { Tag, Tooltip } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Tooltip class="another-classname" style="max-width: 320px">
        <Tag style="margin-right: 8px">Custom Style And ClassName</Tag>
        {#snippet content()}hi semi semi semi semi semi semi semi{/snippet}
    </Tooltip>
</div>
