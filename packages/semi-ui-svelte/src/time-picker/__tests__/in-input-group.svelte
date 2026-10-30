<script lang="ts">
    import Button from '../../button/button.svelte';
    import { InputGroup } from '../../input';
    import TimePicker from '../time-picker.svelte';
</script>

<InputGroup disabled size="large">
    <TimePicker aria-label="inherit" />
    <TimePicker aria-label="own" disabled={false} size="small" />
    <TimePicker aria-label="inner">
        {#snippet prefix()}<Button>probe</Button>{/snippet}
    </TimePicker>
</InputGroup>
