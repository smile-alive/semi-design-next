<script lang="ts">
    import InputNumber from '../../input-number/input-number.svelte';
    import Popover from '../../popover/popover.svelte';
    import InputGroup from '../input-group.svelte';
    import Input from '../input.svelte';
</script>

<InputGroup disabled size="large">
    <Popover trigger="custom" visible>
        {#snippet content()}
            <Input aria-label="popup-input" />
            <InputNumber aria-label="popup-number" />
        {/snippet}
        <Input aria-label="trigger-input" />
    </Popover>
</InputGroup>
