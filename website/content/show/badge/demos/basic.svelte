<script lang="ts">
    import { IconLock } from '@fibrae/semi-icons-svelte';
    import { Avatar, Badge } from '@fibrae/semi-ui-svelte';

    const style = 'width: 42px; height: 42px; border-radius: 4px';
</script>

<div>
    <Badge count={5}>
        <Avatar color="blue" shape="square" {style}>BM</Avatar>
    </Badge>
    <br />
    <br />
    <Badge dot>
        <Avatar color="blue" shape="square" {style}>YL</Avatar>
    </Badge>
    <br />
    <br />
    <Badge>
        {#snippet count()}
            <IconLock style="color: var(--semi-color-primary)" />
        {/snippet}
        <Avatar color="light-blue" shape="square" {style}>XZ</Avatar>
    </Badge>
    <br />
    <br />
    <Badge count="NEW">
        <Avatar color="light-blue" shape="square" {style}>WF</Avatar>
    </Badge>
</div>
