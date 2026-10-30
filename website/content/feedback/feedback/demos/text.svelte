<script lang="ts">
    import { Button, Feedback } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const onOk = () => {
        visible = false;
    };
    const textAreaProps = { maxCount: 200 };
</script>

<Button onclick={() => (visible = !visible)}>展示反馈: Popup, text</Button>
<Feedback bind:visible {onOk} {textAreaProps} title="您对本产品的建议是？" type="text" />
