<script lang="ts">
    import { IconToken } from '@fibrae/semi-icons-svelte/lab';
    import { Button, Dropdown, DropdownItem, DropdownMenu, Toast } from '@fibrae/semi-ui-svelte';
</script>

<Dropdown position="bottomLeft" trigger="click">
    <Button theme="outline" type="tertiary">
        {#snippet icon()}<IconToken />{/snippet}
        Click Me
    </Button>
    {#snippet content()}
        <DropdownMenu>
            <DropdownItem onclick={() => Toast.info('You clicked me!')}>1: click me!</DropdownItem>
            <DropdownItem onmouseenter={() => Toast.info('Nice to meet you!')}>2: mouse enter</DropdownItem>
            <DropdownItem onmouseleave={() => Toast.info('See ya!')}>3: mouse leave</DropdownItem>
            <DropdownItem oncontextmenu={() => Toast.info('Right clicked!')}>4: right click</DropdownItem>
        </DropdownMenu>
    {/snippet}
</Dropdown>
