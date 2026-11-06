<script lang="ts">
    import { TagInput } from '@fibrae/semi-ui-svelte';

    let value = $state(['抖音', '火山', '西瓜视频']);
</script>

<TagInput bind:value maxTagCount={2} onChange={(v) => console.log(v)} restTagsPopoverProps={{ position: 'top' }} showRestTagsPopover />
