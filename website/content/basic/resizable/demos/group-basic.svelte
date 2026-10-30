<script lang="ts">
    import { ResizeGroup, ResizeHandler, ResizeItem } from '@fibrae/semi-ui-svelte';

    let text = $state('Drag to resize');
    const itemStyle = 'background-color: var(--semi-grey-1); border: var(--semi-color-border) 1px solid';
</script>

<div style="width: 1000px; height: 100px">
    <ResizeGroup direction="horizontal">
        <ResizeItem defaultSize="400px" min="10%" onChange={() => (text = 'resizing')} onResizeEnd={() => (text = 'Drag to resize')} style={itemStyle}>
            <div style="margin-left: 20%">{text + ' min:10%'}</div>
        </ResizeItem>
        <ResizeHandler />
        <ResizeItem defaultSize="20%" max="30%" min="10%" onChange={() => (text = 'resizing')} style={itemStyle}>
            <div style="margin-left: 20%">{text + ' min:10% max:30%'}</div>
        </ResizeItem>
        <ResizeHandler />
        <ResizeItem defaultSize="0.5" onChange={() => (text = 'resizing')} style={itemStyle}>
            <div style="margin-left: 20%">{text}</div>
        </ResizeItem>
        <ResizeHandler />
        <ResizeItem defaultSize={1} onChange={() => (text = 'resizing')} style={itemStyle}>
            <div style="margin-left: 20%">{text}</div>
        </ResizeItem>
    </ResizeGroup>
</div>
