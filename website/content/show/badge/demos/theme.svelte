<script lang="ts">
    import { Avatar, Badge } from '@fibrae/semi-ui-svelte';

    const bgStyle = 'padding: 8px';
    const style = 'width: 42px; height: 42px; border-radius: 4px';
</script>

<div style="display: flex">
    <div style={bgStyle}>
        <Badge count={5} theme="solid">
            <Avatar color="indigo" shape="square" {style}>XZ</Avatar>
        </Badge>
    </div>
    <div style={bgStyle}>
        <Badge count={5} theme="light">
            <Avatar color="indigo" shape="square" {style}>YB</Avatar>
        </Badge>
    </div>
    <div style={bgStyle}>
        <Badge count={5} theme="inverted">
            <Avatar color="light-green" shape="square" {style}>LX</Avatar>
        </Badge>
    </div>
    <br />
    <div style={bgStyle}>
        <Badge dot theme="solid">
            <Avatar color="light-green" shape="square" {style}>YZ</Avatar>
        </Badge>
    </div>
    <div style={bgStyle}>
        <Badge dot theme="light">
            <Avatar color="lime" shape="square" {style}>HW</Avatar>
        </Badge>
    </div>
    <div style="padding: 8px; border-radius: 4px; background-color: var(--semi-color-fill-0)">
        <Badge dot theme="inverted">
            <Avatar color="lime" shape="square" {style}>XM</Avatar>
        </Badge>
    </div>
</div>
