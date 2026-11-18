<script lang="ts">
    import { Button, Spin } from '@fibrae/semi-ui-svelte';
    import { useSpinDelay } from '@fibrae/semi-ui-svelte/hooks';

    let loading = $state(false);
    const spin = useSpinDelay(
        () => loading,
        () => ({ delay: 300, minDuration: 600 })
    );

    const load = (ms: number) => {
        loading = true;
        setTimeout(() => (loading = false), ms);
    };
</script>

<div>
    <Button style="margin-inline-end: 12px" onclick={() => load(200)}>200ms 的请求</Button>
    <Button style="margin-inline-end: 20px" onclick={() => load(800)}>800ms 的请求</Button>
    <Spin spinning={spin.visible} />
</div>
