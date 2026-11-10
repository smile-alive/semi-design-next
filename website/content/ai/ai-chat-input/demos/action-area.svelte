<script lang="ts">
    import { AIChatInput } from '@fibrae/semi-ai-svelte';
    import { IconDeleteStroked } from '@fibrae/semi-icons-svelte';
    import { Button, Divider } from '@fibrae/semi-ui-svelte';
    import { mockUpload } from '#/lib/mock-upload';

    const uploadProps = { action: '/upload', customRequest: mockUpload };
</script>

<AIChatInput placeholder="输入内容或者上传内容..." style="margin: 12px" {uploadProps}>
    {#snippet actionArea(actionArea)}
        <div class={actionArea.class}>
            <div style="display: flex; align-items: center">
                <Button aria-label="清空内容" style="border-radius: 50%" type="tertiary">
                    {#snippet icon()}
                        <IconDeleteStroked />
                    {/snippet}
                </Button>
                <Divider layout="vertical" style="margin-inline-start: 8px" />
            </div>
            {@render actionArea.upload()}
            {@render actionArea.send()}
        </div>
    {/snippet}
</AIChatInput>
