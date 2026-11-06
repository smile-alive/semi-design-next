<script lang="ts">
    import { Button, Spin } from '@fibrae/semi-ui-svelte';

    let loading = $state(false);
</script>

<div>
    <Button style="margin-inline-end: 20px" onclick={() => (loading = !loading)}>延迟显示的spin</Button>
    <Spin delay={1000} spinning={loading} />
</div>
