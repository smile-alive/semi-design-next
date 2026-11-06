<script lang="ts">
    import { Button, Feedback } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const onOk = () => {
        visible = false;
    };
</script>

<Button onclick={() => (visible = !visible)}>展示反馈: Popup, text</Button>
<Feedback bind:visible {onOk} textAreaProps={{ maxCount: 200 }} title="您对本产品的建议是？" type="text" />
