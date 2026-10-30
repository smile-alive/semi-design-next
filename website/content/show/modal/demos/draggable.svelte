<script lang="ts">
    import { Button, dragMove, Modal } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
</script>

<div>
    <Button onclick={() => (visible = true)}>Open Modal</Button>
    <Modal {@attach dragMove({ positionStrategy: 'relative' })} bind:visible centered title="可拖拽Modal">
        <p>This is the content of a basic sidesheet.</p>
        <p>Here is more content...</p>
    </Modal>
</div>
