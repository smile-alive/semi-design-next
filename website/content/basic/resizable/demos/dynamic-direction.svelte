<script lang="ts">
    import { Button, ResizeGroup, ResizeHandler, ResizeItem } from '@fibrae/semi-ui-svelte';

    let text = $state('drag to resize');
    let direction = $state<'horizontal' | 'vertical'>('horizontal');
    const itemStyle = 'background-color: var(--semi-grey-1)';
    const contentStyle = 'margin-left: 20%; padding: 5px';

    const changeDirection = () => {
        direction = direction === 'horizontal' ? 'vertical' : 'horizontal';
    };
</script>

<div style="width: 400px; height: 300px">
    <Button onclick={changeDirection}>{direction}</Button>
    <ResizeGroup {direction}>
        <ResizeItem defaultSize={5} onChange={() => (text = 'resizing')} onResizeEnd={() => (text = 'drag to resize')}>
            <ResizeGroup direction="horizontal">
                <ResizeItem onChange={() => (text = 'resizing')} onResizeEnd={() => (text = 'drag to resize')} style={itemStyle}>
                    <div style={contentStyle}>{text}</div>
                </ResizeItem>
                <ResizeHandler />
                <ResizeItem onChange={() => (text = 'resizing')} style={itemStyle}>
                    <div style={contentStyle}>{text}</div>
                </ResizeItem>
            </ResizeGroup>
        </ResizeItem>
        <ResizeHandler />
        <ResizeItem defaultSize={1.3} onChange={() => (text = 'resizing')} style={itemStyle}>
            <div style={contentStyle}>{text}</div>
        </ResizeItem>
    </ResizeGroup>
</div>
