<script lang="ts">
    import { Button, Feedback, TextArea } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    let value = $state('');
    const onOk = () => {
        visible = false;
    };
</script>

<Button onclick={() => (visible = !visible)}>展示反馈: Popup, custom</Button>
<Feedback bind:visible okButtonProps={{ disabled: !value }} {onOk} title="您对本产品的建议是？" type="custom">
    <span>这是一段自定义的内容</span>
    <TextArea bind:value />
</Feedback>
