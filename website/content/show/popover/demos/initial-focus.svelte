<script lang="ts">
    import { Button, Input, Popover, Space } from '@fibrae/semi-ui-svelte';
</script>

<Popover trigger="click">
    <Button>click me</Button>
    {#snippet content(contentProps)}
        <div style="padding: 12px">
            <Space>
                <Button>first focusable element</Button>
                <Input {@attach contentProps.initialFocusRef} placeholder="focus here" />
            </Space>
        </div>
    {/snippet}
</Popover>
