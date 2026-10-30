<script lang="ts">
    import { Button, TagInput } from '@fibrae/semi-ui-svelte';

    let value = $state(['抖音', '火山']);
    let tagInput = $state<ReturnType<typeof TagInput>>();
</script>

<TagInput bind:this={tagInput} bind:value />
<Button style="margin-top: 10px" onclick={() => tagInput?.focus()}>点击按钮聚焦</Button>
