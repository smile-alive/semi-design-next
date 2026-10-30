<script lang="ts">
    import { TagInput } from '@fibrae/semi-ui-svelte';

    let value = $state(['抖音', '火山', '西瓜视频']);
</script>

<TagInput allowDuplicates={false} bind:value placeholder="请输入..." />
