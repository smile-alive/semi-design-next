<script lang="ts">
    import { Card, CardMeta, Switch } from '@fibrae/semi-ui-svelte';

    let loading = $state(true);
</script>

<Switch aria-label="显示内容" onChange={(v) => (loading = !v)} />
<br />
<br />
<Card {loading} style="max-width: 360px">
    <CardMeta title="Semi Doc">
        {#snippet description()}全面、易用、优质{/snippet}
    </CardMeta>
</Card>
