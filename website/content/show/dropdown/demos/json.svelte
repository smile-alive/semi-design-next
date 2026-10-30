<script lang="ts">
    import { IconToken } from '@fibrae/semi-icons-svelte/lab';
    import { Button, Dropdown, type DropDownMenuItem } from '@fibrae/semi-ui-svelte';

    const menu: DropDownMenuItem[] = [
        { node: 'title', name: '分组1' },
        { node: 'item', name: 'primary1', type: 'primary', onclick: () => console.log('click primary') },
        { node: 'item', name: 'secondary', type: 'secondary' },
        { node: 'divider' },
        { node: 'title', name: '分组2' },
        { node: 'item', name: 'tertiary', type: 'tertiary' },
        { node: 'item', name: 'warning', type: 'warning', active: true },
        { node: 'item', name: 'danger', type: 'danger' },
    ];
</script>

<Dropdown {menu} position="bottomLeft" showTick trigger="click">
    <Button theme="outline" type="tertiary">
        {#snippet icon()}<IconToken />{/snippet}
        Click Me
    </Button>
</Dropdown>
