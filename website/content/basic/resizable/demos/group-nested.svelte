<script lang="ts">
    import { ResizeGroup, ResizeHandler, ResizeItem, Toast } from '@fibrae/semi-ui-svelte';

    const opts_1 = {
        content: 'resize start',
        duration: 1,
        stack: true,
    };
    const opts = {
        content: 'resize end',
        duration: 1,
        stack: true,
    };
    const itemStyle = 'background-color: var(--semi-grey-1); border: var(--semi-color-border) 1px solid';

    let text = $state('Drag to resize');
</script>

<div style="width: 1000px; height: 600px">
    <ResizeGroup direction="vertical">
        <ResizeItem
            defaultSize="20%"
            onChange={() => (text = 'resizing')}
            onResizeEnd={() => {
                Toast.info(opts);
                text = 'Drag to resize';
            }}
            onResizeStart={() => {
                Toast.info(opts_1);
            }}
            style="background-color: var(--semi-grey-1)"
        >
            <div style="margin-inline-start: 20%">header</div>
        </ResizeItem>
        <ResizeHandler />
        <ResizeItem defaultSize="80%" onChange={() => (text = 'resizing')}>
            <ResizeGroup direction="horizontal">
                <ResizeItem
                    defaultSize="25%"
                    onChange={() => (text = 'resizing')}
                    onResizeEnd={() => {
                        Toast.info(opts);
                        text = 'Drag to resize';
                    }}
                    onResizeStart={() => {
                        Toast.info(opts_1);
                    }}
                    style={itemStyle}
                >
                    <div style="margin-inline-start: 20%">tab</div>
                </ResizeItem>
                <ResizeHandler />
                <ResizeItem defaultSize="75%" onChange={() => (text = 'resizing')} style={itemStyle}>
                    <div style="margin-inline-start: 20%">{text}</div>
                </ResizeItem>
            </ResizeGroup>
        </ResizeItem>
    </ResizeGroup>
</div>
