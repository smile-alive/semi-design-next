<script lang="ts">
    import { Upload } from '@fibrae/semi-ui-svelte';
    import { mockUpload } from '#/lib/mock-upload';
</script>

<Upload action="/upload" customRequest={mockUpload} draggable>
    {#snippet dragMainText()}点击上传文件或拖拽文件到这里{/snippet}
    {#snippet dragSubText()}支持任意类型文件{/snippet}
</Upload>
