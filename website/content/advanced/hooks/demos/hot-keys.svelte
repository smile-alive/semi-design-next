<script lang="ts">
    import { Typography } from '@fibrae/semi-ui-svelte';
    import { useHotKeys } from '@fibrae/semi-ui-svelte/hooks';

    let count = $state(0);
    useHotKeys(
        () => ['Control', 'k'],
        () => (count += 1),
        () => ({ preventDefault: true })
    );
</script>

<Typography.Text>按下 Ctrl + K 的次数：{count}</Typography.Text>
