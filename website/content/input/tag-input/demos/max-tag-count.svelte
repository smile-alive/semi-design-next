<script lang="ts">
    import { TagInput } from '@fibrae/semi-ui-svelte';

    let value = $state(['抖音', '火山', '西瓜视频']);
    const restTagsPopoverProps = { position: 'top' } as const;
</script>

<TagInput bind:value maxTagCount={2} {restTagsPopoverProps} showRestTagsPopover />
