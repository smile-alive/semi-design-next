<script lang="ts">
    import { HotKeys, Modal } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const close = () => {
        visible = false;
    };
    const metaKeys = [HotKeys.Keys.Meta, HotKeys.Keys.S];
    const controlKeys = [HotKeys.Keys.Control, HotKeys.Keys.S];
</script>

<div>
    <HotKeys hotKeys={metaKeys} onHotKey={() => (visible = true)} preventDefault />
    <br />
    <HotKeys hotKeys={controlKeys} onHotKey={() => (visible = true)} preventDefault />
    <Modal bind:visible onOk={close} title="Dialog">This is the Modal opened by hotkey: Meta/Control + S.</Modal>
</div>
