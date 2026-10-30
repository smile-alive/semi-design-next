<script lang="ts">
    import { AIChatInput } from '@fibrae/semi-ai-svelte';
    import { IconDeleteStroked } from '@fibrae/semi-icons-svelte';
    import { Button, Divider } from '@fibrae/semi-ui-svelte';

    const uploadProps = { action: 'https://api.semi.design/upload' };
</script>

<AIChatInput placeholder="输入内容或者上传内容..." style="margin: 12px" {uploadProps}>
    {#snippet actionArea({ upload, send, class: actionClass })}
        <div class={actionClass}>
            <div style="display: flex; align-items: center">
                <Button aria-label="清空内容" style="border-radius: 50%" type="tertiary">
                    {#snippet icon()}
                        <IconDeleteStroked />
                    {/snippet}
                </Button>
                <Divider layout="vertical" style="margin-left: 8px" />
            </div>
            {@render upload()}
            {@render send()}
        </div>
    {/snippet}
</AIChatInput>
