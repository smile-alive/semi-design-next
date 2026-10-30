<script lang="ts">
    import { Button, Modal } from '@fibrae/semi-ui-svelte';

    // Reads the contexts (ConfigProvider, LocaleProvider) of this component, so call it during initialization
    const modal = Modal.useModal();
</script>

<div>
    <Button onclick={() => modal.confirm({ title: 'This is a success message', content: 'Context consumer' })}>Confirm Modal</Button>
</div>
