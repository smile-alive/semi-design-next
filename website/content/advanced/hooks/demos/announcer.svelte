<script lang="ts">
    import { Button, Space, Typography } from '@fibrae/semi-ui-svelte';
    import { useAnnouncer } from '@fibrae/semi-ui-svelte/hooks';

    let count = $state(0);
    const announce = useAnnouncer();

    const add = () => {
        count += 1;
        announce(`已加入购物车，共 ${count} 件`);
    };
</script>

<Space spacing="loose">
    <Button onclick={add}>加入购物车</Button>
    <Typography.Text>购物车：{count} 件</Typography.Text>
</Space>
