<script lang="ts">
    import { HotKeys, Input, Modal } from '@fibrae/semi-ui-svelte';

    const hotKeys = ['Control', 'q'];
    let visible = $state(false);
    const close = () => {
        visible = false;
    };
    let input = $state<ReturnType<typeof Input>>();
    const getListenerTarget = () => input?.getInput();
</script>

<div>
    <Input bind:this={input} placeholder="test for target" />
    <HotKeys {getListenerTarget} {hotKeys} onHotKey={() => (visible = true)} />
    <Modal bind:visible onOk={close} title="Dialog">This is the Modal opened by hotkey: {hotKeys.join('+')}.</Modal>
</div>
