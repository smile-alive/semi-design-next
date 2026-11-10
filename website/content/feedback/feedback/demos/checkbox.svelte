<script lang="ts">
    import { Button, Feedback } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const onOk = () => {
        visible = false;
    };
</script>

<Button onclick={() => (visible = !visible)}>展示反馈: Popup, checkbox</Button>
<Feedback bind:visible checkboxGroupProps={{ options: ['短视频', '直播', '资讯'] }} {onOk} title="您最常使用以下哪些产品？" type="checkbox" />
