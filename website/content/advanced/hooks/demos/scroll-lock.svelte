<script lang="ts">
    import { Space, Switch, Typography } from '@fibrae/semi-ui-svelte';
    import { useScrollLock } from '@fibrae/semi-ui-svelte/hooks';

    let locked = $state(false);
    useScrollLock(() => locked);
</script>

<Space>
    <Switch aria-labelledby="scroll-lock-label" checked={locked} onChange={(checked) => (locked = checked)} />
    <Typography.Text id="scroll-lock-label">锁定页面滚动</Typography.Text>
</Space>
