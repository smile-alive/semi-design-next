<script lang="ts">
    import { IconAlertCircle, IconBox, IconForward, IconRefresh, IconSearch, IconSetting } from '@fibrae/semi-icons-svelte';
    import { IconToken } from '@fibrae/semi-icons-svelte/lab';
    import { Button, Dropdown, HotKeys } from '@fibrae/semi-ui-svelte';
</script>

<Dropdown position="bottomLeft">
    <Button theme="outline" type="tertiary">
        {#snippet icon()}<IconToken />{/snippet}
        Hover Me
    </Button>
    {#snippet content()}
        <Dropdown.Menu>
            <Dropdown.Title>分组1</Dropdown.Title>
            <Dropdown.Item>
                {#snippet icon()}<IconBox />{/snippet}
                Menu Item 1
                <HotKeys content={['Ctrl', 'B']} hotKeys={[HotKeys.Keys.Control, HotKeys.Keys.B]} style="margin-inline-start: 20px" />
            </Dropdown.Item>
            <Dropdown.Item>
                {#snippet icon()}<IconSetting />{/snippet}
                Menu Item 2
                <HotKeys content={['Ctrl', 'V']} hotKeys={[HotKeys.Keys.Control, HotKeys.Keys.V]} style="margin-inline-start: 20px" />
            </Dropdown.Item>
            <Dropdown.Item disabled>
                {#snippet icon()}<IconForward />{/snippet}
                Menu Item 3
                <HotKeys content={['Ctrl', 'F3']} hotKeys={[HotKeys.Keys.Control, HotKeys.Keys.F3]} style="margin-inline-start: 20px" />
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Title>分组2</Dropdown.Title>
            <Dropdown.Item type="tertiary">
                {#snippet icon()}<IconRefresh />{/snippet}
                tertiary
            </Dropdown.Item>
            <Dropdown.Item type="warning">
                {#snippet icon()}<IconSearch />{/snippet}
                warning
            </Dropdown.Item>
            <Dropdown.Item type="danger">
                {#snippet icon()}<IconAlertCircle />{/snippet}
                danger
            </Dropdown.Item>
        </Dropdown.Menu>
    {/snippet}
</Dropdown>
