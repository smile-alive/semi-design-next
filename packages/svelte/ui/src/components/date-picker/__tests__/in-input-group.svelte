<script lang="ts">
    import Button from '../../button/button.svelte';
    import { InputGroup } from '../../input';
    import DatePicker from '../date-picker.svelte';
</script>

<InputGroup disabled size="large">
    <DatePicker aria-label="inherit" />
    <DatePicker aria-label="own" disabled={false} size="small" />
    <DatePicker aria-label="inner">
        {#snippet prefix()}<Button>probe</Button>{/snippet}
    </DatePicker>
</InputGroup>
