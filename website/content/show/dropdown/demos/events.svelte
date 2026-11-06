<script lang="ts">
    import { IconToken } from '@fibrae/semi-icons-svelte/lab';
    import { Button, Dropdown, Toast } from '@fibrae/semi-ui-svelte';
</script>

<Dropdown position="bottomLeft" trigger="click">
    <Button theme="outline" type="tertiary">
        {#snippet icon()}<IconToken />{/snippet}
        Click Me
    </Button>
    {#snippet content()}
        <Dropdown.Menu>
            <Dropdown.Item onclick={() => Toast.info({ content: 'You clicked me!' })}>1: click me!</Dropdown.Item>
            <Dropdown.Item onmouseenter={() => Toast.info({ content: 'Nice to meet you!' })}>2: mouse enter</Dropdown.Item>
            <Dropdown.Item onmouseleave={() => Toast.info({ content: 'See ya!' })}>3: mouse leave</Dropdown.Item>
            <Dropdown.Item oncontextmenu={() => Toast.info({ content: 'Right clicked!' })}>4: right click</Dropdown.Item>
        </Dropdown.Menu>
    {/snippet}
</Dropdown>
