<script lang="ts">
    import { TagInput } from '@fibrae/semi-ui-svelte';

    let value = $state(['抖音', '火山']);
</script>

<TagInput bind:value onChange={(v) => console.log(v)} placeholder="请输入..." showClear />
