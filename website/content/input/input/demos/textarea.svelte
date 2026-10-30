<script lang="ts">
    import { TextArea } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <TextArea aria-label="Text area" />
    <br />
    <br />
    <TextArea aria-label="Text area with character limit" maxCount={100} showClear />
</div>
