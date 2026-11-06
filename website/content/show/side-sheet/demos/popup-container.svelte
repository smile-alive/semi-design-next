<script lang="ts">
    import { Button, SideSheet } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const getContainer = () => document.querySelector('.sidesheet-container') as HTMLElement;
</script>

<div class="sidesheet-container" style="height: 320px; overflow: hidden; position: relative; border: 1px solid var(--semi-color-border); border-radius: 2px; padding: 24px; text-align: center; background: var(--semi-color-fill-0)">
    <span>Render in this</span>
    <br />
    <br />
    <Button onclick={() => (visible = true)}>Open SideSheet</Button>
    <SideSheet bind:visible getPopupContainer={getContainer} title="渲染在指定容器内部" width={220}>
        <p>This is the content of a basic sidesheet.</p>
        <p>Here is more content...</p>
    </SideSheet>
</div>
