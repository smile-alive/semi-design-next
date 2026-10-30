<script lang="ts">
    import { Sidebar } from '@fibrae/semi-ai-svelte';
    import { Button, Switch } from '@fibrae/semi-ui-svelte';

    const { Container } = Sidebar;

    const containerStyle = 'display: flex; height: 500px; border: 1px solid var(--semi-color-border); border-radius: 8px; overflow: hidden; box-sizing: border-box';

    let visible = $state(true);
    let motion = $state(true);
    let resizable = $state(true);
</script>

<div style={containerStyle}>
    <div style="flex-grow: 1; flex-shrink: 1; padding: 20px">
        <div>
            <Button aria-pressed={visible} onclick={() => (visible = !visible)}>显示容器</Button>
            <div style="display: flex; align-items: center; margin-top: 10px">
                <span id="sidebar-container-motion">是否有动画</span>
                <Switch aria-labelledby="sidebar-container-motion" bind:checked={motion} />
            </div>
            <div style="display: flex; align-items: center; margin-top: 10px">
                <span id="sidebar-container-resizable">是否可伸缩</span>
                <Switch aria-labelledby="sidebar-container-resizable" bind:checked={resizable} />
            </div>
        </div>
    </div>
    <Container bind:visible maxWidth="60%" minWidth={250} {motion} {resizable} style={resizable ? undefined : 'width: 200px'} title="基础容器示例" />
</div>
