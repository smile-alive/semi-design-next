<script lang="ts">
    import { TagInput } from '@fibrae/semi-ui-svelte';

    let value = $state(['抖音', '火山', '西瓜视频']);
</script>

<TagInput bind:value disabled placeholder="请输入..." showClear />
