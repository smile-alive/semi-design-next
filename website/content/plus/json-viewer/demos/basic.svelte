<script lang="ts">
    import { JsonViewer } from '@fibrae/semi-ui-svelte';

    const data = `{
    "name": "Semi",
    "version": "0.0.0"
}`;
</script>

<div style="margin-bottom: 16px">
    <JsonViewer height={100} value={data} width={700} />
</div>
