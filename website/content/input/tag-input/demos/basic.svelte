<script lang="ts">
    import { TagInput } from '@fibrae/semi-ui-svelte';

    let value = $state(['短视频', '直播', '长视频']);
</script>

<TagInput bind:value onChange={(v) => console.log(v)} placeholder="请输入..." />
