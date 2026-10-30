<script lang="ts">
    import Button from '../../button/button.svelte';
    import { InputGroup } from '../../input';
    import TagInput from '../tag-input.svelte';
</script>

<InputGroup disabled size="large">
    <TagInput aria-label="inherit" />
    <TagInput aria-label="own" disabled={false} size="small" />
    <TagInput aria-label="inner">
        {#snippet prefix()}<Button>probe</Button>{/snippet}
    </TagInput>
</InputGroup>
