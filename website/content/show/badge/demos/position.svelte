<script lang="ts">
    import { Avatar, Badge } from '@fibrae/semi-ui-svelte';

    const style = 'width: 42px; height: 42px; border-radius: 4px';
</script>

<div>
    <Badge count="VIP" position="rightTop" type="danger">
        <Avatar color="amber" shape="square" {style}>ZH</Avatar>
    </Badge>
    <br />
    <br />
    <Badge count="VIP" position="rightBottom" type="danger">
        <Avatar color="amber" shape="square" {style}>HS</Avatar>
    </Badge>
    <br />
    <br />
    <Badge count="VIP" position="leftTop" type="danger">
        <Avatar color="orange" shape="square" {style}>DY</Avatar>
    </Badge>
    <br />
    <br />
    <Badge count="VIP" position="leftBottom" type="danger">
        <Avatar color="orange" shape="square" {style}>TT</Avatar>
    </Badge>
</div>
