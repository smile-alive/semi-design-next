<script lang="ts">
    import { Resizable, Toast } from '@fibrae/semi-ui-svelte';

    let text = $state('Drag edge to resize');
    const opts_1 = {
        content: 'resize start',
        duration: 1,
        stack: true,
    };
    const opts_2 = {
        content: 'resize end',
        duration: 1,
        stack: true,
    };

    const onResizeStart = () => {
        Toast.info(opts_1);
    };

    const onResizeEnd = () => {
        Toast.info(opts_2);
        text = 'Drag edge to resize';
    };
</script>

<div style="width: 500px">
    <Resizable defaultSize={{ width: '60%', height: 300 }} onChange={() => (text = 'resizing')} {onResizeEnd} {onResizeStart} style="background-color: var(--semi-grey-1)">
        <div style="margin-left: 20%">{text}</div>
    </Resizable>
</div>
