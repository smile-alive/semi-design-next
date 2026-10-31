<script lang="ts">
    import { InputGroup } from '../../input';
    import IconButton from '../icon-button.svelte';
</script>

<InputGroup disabled size="large">
    <IconButton aria-label="plain" />
    <IconButton aria-label="own-size" size="small" />
    <IconButton aria-label="own-enabled" disabled={false} />
</InputGroup>
