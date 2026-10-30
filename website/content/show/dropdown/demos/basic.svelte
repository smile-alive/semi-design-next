<script lang="ts">
    import { IconAlertCircle, IconBox, IconForward, IconRefresh, IconSearch, IconSetting } from '@fibrae/semi-icons-svelte';
    import { IconToken } from '@fibrae/semi-icons-svelte/lab';
    import { Button, Dropdown, DropdownDivider, DropdownItem, DropdownMenu, DropdownTitle, HotKeys } from '@fibrae/semi-ui-svelte';
</script>

<Dropdown position="bottomLeft">
    <Button theme="outline" type="tertiary">
        {#snippet icon()}<IconToken />{/snippet}
        Hover Me
    </Button>
    {#snippet content()}
        <DropdownMenu>
            <DropdownTitle>分组1</DropdownTitle>
            <DropdownItem>
                {#snippet icon()}<IconBox />{/snippet}
                Menu Item 1
                <HotKeys content={['Ctrl', 'B']} hotKeys={[HotKeys.Keys.Control, HotKeys.Keys.B]} style="margin-left: 20px" />
            </DropdownItem>
            <DropdownItem>
                {#snippet icon()}<IconSetting />{/snippet}
                Menu Item 2
                <HotKeys content={['Ctrl', 'V']} hotKeys={[HotKeys.Keys.Control, HotKeys.Keys.V]} style="margin-left: 20px" />
            </DropdownItem>
            <DropdownItem disabled>
                {#snippet icon()}<IconForward />{/snippet}
                Menu Item 3
                <HotKeys content={['Ctrl', 'F3']} hotKeys={[HotKeys.Keys.Control, HotKeys.Keys.F3]} style="margin-left: 20px" />
            </DropdownItem>
            <DropdownDivider />
            <DropdownTitle>分组2</DropdownTitle>
            <DropdownItem type="tertiary">
                {#snippet icon()}<IconRefresh />{/snippet}
                tertiary
            </DropdownItem>
            <DropdownItem type="warning">
                {#snippet icon()}<IconSearch />{/snippet}
                warning
            </DropdownItem>
            <DropdownItem type="danger">
                {#snippet icon()}<IconAlertCircle />{/snippet}
                danger
            </DropdownItem>
        </DropdownMenu>
    {/snippet}
</Dropdown>
