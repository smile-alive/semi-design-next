<script lang="ts">
    import { HotKeys, Modal } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const close = () => {
        visible = false;
    };
    const hotKeys = [HotKeys.Keys.Control, 'Shift', HotKeys.Keys.A];
</script>

<div>
    <HotKeys {hotKeys} onHotKey={() => (visible = true)} />
    <Modal bind:visible onOk={close} title="Dialog">This is the Modal opened by hotkey: {hotKeys.join('+')}.</Modal>
</div>
