<script lang="ts">
    import { Avatar, Badge } from '@fibrae/semi-ui-svelte';

    const bgStyle = 'padding: 8px 8px 3px 8px';
    const style = 'width: 42px; height: 42px; border-radius: 4px';
</script>

<div style="display: flex">
    <div style={bgStyle}>
        <Badge count={5} type="primary">
            <Avatar color="violet" shape="square" {style}>MR</Avatar>
        </Badge>
    </div>
    <div style={bgStyle}>
        <Badge count={5} type="secondary">
            <Avatar color="violet" shape="square" {style}>YL</Avatar>
        </Badge>
    </div>
    <div style={bgStyle}>
        <Badge count={5} type="tertiary">
            <Avatar color="red" shape="square" {style}>ZW</Avatar>
        </Badge>
    </div>
    <br />
    <div style={bgStyle}>
        <Badge count={5} type="warning">
            <Avatar color="red" shape="square" {style}>JL</Avatar>
        </Badge>
    </div>
    <div style={bgStyle}>
        <Badge count={5} type="danger">
            <Avatar color="pink" shape="square" {style}>RT</Avatar>
        </Badge>
    </div>
    <div style={bgStyle}>
        <Badge dot type="primary">
            <Avatar color="pink" shape="square" {style}>YF</Avatar>
        </Badge>
    </div>
</div>
