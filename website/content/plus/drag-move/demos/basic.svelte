<script lang="ts">
    import { dragMove } from '@fibrae/semi-ui-svelte';
</script>

<!-- dragMove positions the element absolutely, so the wrapper keeps room for it in the preview -->
<div style="height: 120px">
    <div {@attach dragMove()} style:align-items="center" style:background-color="var(--semi-color-primary)" style:border-radius="10px" style:color="var(--semi-white)" style:display="flex" style:font-weight="500" style:height="80px" style:justify-content="center" style:position="absolute" style:width="80px">
        Drag me
    </div>
</div>
