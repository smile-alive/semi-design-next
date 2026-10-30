<script lang="ts">
    import Button from '../../button/button.svelte';
    import { InputGroup } from '../../input';
    import InputNumber from '../input-number.svelte';
</script>

<InputGroup disabled size="large">
    <InputNumber aria-label="inherit" value={1} />
    <InputNumber aria-label="own" disabled={false} size="small" value={2} />
    <InputNumber aria-label="inner" value={3}>
        {#snippet prefix()}<Button>probe</Button>{/snippet}
    </InputNumber>
</InputGroup>
