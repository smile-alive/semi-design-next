<script lang="ts">
    import { Button, Resizable, type ResizableProps } from '@fibrae/semi-ui-svelte';

    let size = $state<NonNullable<ResizableProps['size']>>({ width: 200, height: 100 });

    const grow = () => {
        size = { width: Number(size.width) + 10, height: Number(size.height) + 10 };
    };
</script>

<div style="width: 500px; height: 60%">
    <Button onclick={grow}>set += 10</Button>
    <Resizable onChange={(next) => (size = next)} {size} style="background-color: var(--semi-grey-1); margin-top: 10px">
        <div style="margin-left: 20%">受控</div>
    </Resizable>
</div>
