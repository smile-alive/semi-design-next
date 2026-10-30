<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload } from '@fibrae/semi-ui-svelte';
</script>

<Upload action="https://api.semi.design/upload" directory>
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        上传文件夹
    </Button>
</Upload>
