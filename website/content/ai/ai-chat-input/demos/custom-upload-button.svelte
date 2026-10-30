<script lang="ts">
    import { AIChatInput } from '@fibrae/semi-ai-svelte';
    import { IconUpload } from '@fibrae/semi-icons-svelte';

    const uploadProps = { action: 'https://api.semi.design/upload' };

    // Upload opens the dialog on a click that reaches it; stopping the click here opens it once, from the callback
    const open = (event: MouseEvent, onOpenFileDialog: () => void) => {
        event.stopPropagation();
        onOpenFileDialog();
    };
</script>

<AIChatInput placeholder="自定义上传按钮（仍支持粘贴上传）" style="margin: 12px" {uploadProps}>
    {#snippet uploadButton({ onOpenFileDialog, disabled })}
        <button aria-label="上传" class="semi-button semi-button-borderless" {disabled} type="button" onclick={(event) => open(event, onOpenFileDialog)}>
            <IconUpload />
        </button>
    {/snippet}
</AIChatInput>
