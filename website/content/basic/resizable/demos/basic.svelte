<script lang="ts">
    import { Resizable, Toast } from '@fibrae/semi-ui-svelte';

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

    let text = $state('Drag edge to resize');
</script>

<div style="width: 500px">
    <Resizable
        defaultSize={{ width: '60%', height: 300 }}
        onChange={() => (text = 'resizing')}
        onResizeEnd={() => {
            Toast.info(opts_2);
            text = 'Drag edge to resize';
        }}
        onResizeStart={() => {
            Toast.info(opts_1);
        }}
        style="background-color: var(--semi-grey-1)"
    >
        <div style="margin-inline-start: 20%">{text}</div>
    </Resizable>
</div>
