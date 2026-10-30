<script lang="ts">
    import { Button, Spin } from '@fibrae/semi-ui-svelte';

    let loading = $state(false);
</script>

<div>
    <Button style="margin-right: 20px" onclick={() => (loading = !loading)}>受控的 Spin</Button>
    <Spin spinning={loading} />
</div>
