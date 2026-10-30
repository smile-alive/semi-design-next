<script lang="ts">
    import Tooltip from '../../tooltip/tooltip.svelte';
    import ButtonGroup from '../button-group.svelte';
    import Button from '../button.svelte';
</script>

<ButtonGroup disabled type="danger">
    <Tooltip motion={false} trigger="custom" visible>
        {#snippet content()}<Button>in popup</Button>{/snippet}
        <Button>wrapped</Button>
    </Tooltip>
    <Button>own</Button>
</ButtonGroup>
