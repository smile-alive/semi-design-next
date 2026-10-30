<script lang="ts">
    import { Button, Spin } from '@fibrae/semi-ui-svelte';

    let loading = $state(false);
</script>

<div>
    <Button style="margin-right: 20px" onclick={() => (loading = !loading)}>延迟显示的 Spin</Button>
    <Spin delay={1000} spinning={loading} />
</div>
