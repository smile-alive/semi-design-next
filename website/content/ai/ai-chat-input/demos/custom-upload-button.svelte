<script lang="ts">
    import { AIChatInput } from '@fibrae/semi-ai-svelte';
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { mockUpload } from '#/lib/mock-upload';

    const uploadProps = { action: '/upload', customRequest: mockUpload };

    // Upload opens the dialog on a click that reaches it; stopping the click here opens it once, from the callback
    const open = (event: MouseEvent, onOpenFileDialog: () => void) => {
        event.stopPropagation();
        onOpenFileDialog();
    };
</script>

<AIChatInput placeholder="自定义上传按钮（仍支持粘贴上传）" style="margin: 12px" {uploadProps}>
    {#snippet uploadButton(uploadButton)}
        <button aria-label="上传" class="semi-button semi-button-borderless" disabled={uploadButton.disabled} type="button" onclick={(event) => open(event, uploadButton.onOpenFileDialog)}>
            <IconUpload />
        </button>
    {/snippet}
</AIChatInput>
