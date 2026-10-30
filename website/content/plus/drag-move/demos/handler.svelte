<script lang="ts">
    import { IconTransparentStroked } from '@fibrae/semi-icons-svelte';
    import { dragMove } from '@fibrae/semi-ui-svelte';

    let container = $state<HTMLDivElement>();
    let handlerEl = $state<HTMLDivElement>();
</script>

<div bind:this={container} style="background-color: var(--semi-grey-2); width: 300px; height: 300px; padding: 5px; position: relative; color: var(--semi-white); font-weight: 500">
    <span style="color: var(--semi-color-text-0)">Constrainer</span>
    <div
        {@attach dragMove({ constrainer: () => container ?? null, handler: () => handlerEl ?? null })}
        style:align-items="center"
        style:background-color="var(--semi-color-primary)"
        style:border-radius="10px"
        style:display="flex"
        style:height="80px"
        style:justify-content="center"
        style:left="50px"
        style:position="absolute"
        style:top="50px"
        style:width="80px"
    >
        <div bind:this={handlerEl} style="width: fit-content; height: fit-content">
            <IconTransparentStroked size="large" />
        </div>
    </div>
</div>
