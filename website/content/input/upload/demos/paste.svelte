<script lang="ts">
    import { Toast, Upload } from '@fibrae/semi-ui-svelte';
</script>

<Upload action="https://api.semi.design/upload" addOnPasting draggable onPastingError={() => Toast.error('读取剪贴板中的文件失败')}>
    {#snippet dragMainText()}复制截图或文件后，在页面上按 Ctrl/Cmd + V{/snippet}
    {#snippet dragSubText()}也可以点击或拖拽上传{/snippet}
</Upload>
