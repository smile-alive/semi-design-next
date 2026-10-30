<script lang="ts">
    import { IconBolt } from '@fibrae/semi-icons-svelte';
    import { Upload } from '@fibrae/semi-ui-svelte';
</script>

<Upload accept="application/pdf,.jpeg" action="https://api.semi.design/upload" draggable style="margin-top: 10px">
    {#snippet dragIcon()}
        <IconBolt />
    {/snippet}
    {#snippet dragMainText()}点击上传文件或拖拽文件到这里{/snippet}
    {#snippet dragSubText()}仅支持jpeg、pdf{/snippet}
</Upload>
