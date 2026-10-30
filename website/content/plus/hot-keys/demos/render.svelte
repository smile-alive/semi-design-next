<script lang="ts">
    import { HotKeys, Modal, Tag } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const close = () => {
        visible = false;
    };
    const hotKeys = [HotKeys.Keys.Control, HotKeys.Keys.R];
</script>

<div>
    <HotKeys {hotKeys} onHotKey={() => (visible = true)}>
        <Tag>Press Ctrl+R to Open Modal</Tag>
    </HotKeys>
    <Modal bind:visible onOk={close} title="Dialog">This is the Modal opened by hotkey: {hotKeys.join('+')}.</Modal>
</div>
