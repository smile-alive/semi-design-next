<script lang="ts">
    import { Progress } from '@fibrae/semi-ui-svelte';
</script>

<Progress aria-label="disk usage" percent={75} showInfo style="margin: 10px" type="circle">
    {#snippet format({ percent })}{percent}Days{/snippet}
</Progress>
<Progress aria-label="disk usage" percent={100} showInfo style="margin: 10px" type="circle">
    {#snippet format()}Done{/snippet}
</Progress>
<Progress aria-label="disk usage" percent={50} showInfo={false} style="margin: 10px" type="circle" />
