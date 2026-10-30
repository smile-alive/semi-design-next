<script lang="ts">
    import { ResizeGroup, ResizeHandler, ResizeItem } from '@fibrae/semi-ui-svelte';

    let text = $state('Drag to resize');
    const itemStyle = 'background-color: var(--semi-grey-1); border: var(--semi-color-border) 1px solid';
    const borderStyle = 'border: var(--semi-color-border) 1px solid';
</script>

<div style="width: 1000px; height: 600px">
    <ResizeGroup direction="vertical">
        <ResizeItem defaultSize="80%">
            <ResizeGroup direction="horizontal">
                <ResizeItem defaultSize="25%" max="30%" min="10%" style={itemStyle}>
                    <div style="margin-left: 20%">{text + ' min:10% max:30%'}</div>
                </ResizeItem>
                <ResizeHandler />
                <ResizeItem defaultSize="50%" style={borderStyle}>
                    <div style="height: 100%">
                        <ResizeGroup direction="vertical">
                            <ResizeItem defaultSize="33%" min="10%" onChange={() => (text = 'resizing')} onResizeEnd={() => (text = 'Drag to resize')} style={itemStyle}>
                                <div style="margin-left: 20%">{text + ' min:10%'}</div>
                            </ResizeItem>
                            <ResizeHandler />
                            <ResizeItem defaultSize="33%" max="40%" min="10%" style={itemStyle}>
                                <div style="margin-left: 20%">{text + ' min:10% max:40%'}</div>
                            </ResizeItem>
                            <ResizeHandler />
                            <ResizeItem style={itemStyle}>
                                <div style="margin-left: 20%">{text}</div>
                            </ResizeItem>
                        </ResizeGroup>
                    </div>
                </ResizeItem>
                <ResizeHandler />
                <ResizeItem defaultSize="1" max="30%" style={itemStyle}>
                    <div style="margin-left: 20%">{text + ' max:30%'}</div>
                </ResizeItem>
            </ResizeGroup>
        </ResizeItem>
        <ResizeHandler />
        <ResizeItem defaultSize="20%" onChange={() => (text = 'resizing')}>
            <ResizeGroup direction="horizontal">
                <ResizeItem defaultSize="50%" style={itemStyle}>
                    <div style="margin-left: 20%">tab</div>
                </ResizeItem>
                <ResizeHandler />
                <ResizeItem defaultSize="50%" style={itemStyle}>
                    <div style="margin-left: 20%">content</div>
                </ResizeItem>
            </ResizeGroup>
        </ResizeItem>
    </ResizeGroup>
</div>
