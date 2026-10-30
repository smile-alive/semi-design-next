<script lang="ts">
    import { dragMove } from '@fibrae/semi-ui-svelte';

    let container = $state<HTMLDivElement>();
    let startPoint: { x: number; y: number } | null = null;

    const customMove = (element: HTMLElement, top: number, left: number) => {
        if (container && left + 100 > container.offsetWidth) {
            element.style.right = `${container.offsetWidth - left - element.offsetWidth}px`;
            element.style.left = 'auto';
        } else {
            element.style.left = left + 'px';
        }
        element.style.top = top + 'px';
    };

    const toggleWidth = (element: HTMLElement) => {
        element.style.width = element.style.width === '60px' ? '100px' : '60px';
    };

    const onmousedown = (e: MouseEvent) => {
        startPoint = { x: e.clientX, y: e.clientY };
    };

    const onmouseup = (e: MouseEvent) => {
        if (startPoint && Math.abs(e.clientX - startPoint.x) < 5 && Math.abs(e.clientY - startPoint.y) < 5) {
            toggleWidth(e.currentTarget as HTMLElement);
        }
        startPoint = null;
    };

    const onkeydown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            toggleWidth(e.currentTarget as HTMLElement);
        }
    };
</script>

<span>蓝色色块点击可改变宽度，改变前后蓝色色块均不会超出范围限制 </span>
<br />
<br />
<div bind:this={container} style="background-color: var(--semi-grey-2); width: 300px; height: 300px; position: relative; padding: 10px; color: var(--semi-white); font-weight: 500">
    <span style="color: var(--semi-color-text-0)">Constrainer</span>
    <button
        {@attach dragMove({ constrainer: () => container ?? null, customMove })}
        style:align-items="center"
        style:background-color="var(--semi-color-primary)"
        style:border="none"
        style:border-radius="10px"
        style:box-sizing="content-box"
        style:color="inherit"
        style:display="flex"
        style:font="inherit"
        style:height="50px"
        style:justify-content="center"
        style:left="50px"
        style:padding="5px"
        style:position="absolute"
        style:top="50px"
        style:width="60px"
        type="button"
        {onkeydown}
        {onmousedown}
        {onmouseup}
    >
        Drag me
    </button>
</div>
