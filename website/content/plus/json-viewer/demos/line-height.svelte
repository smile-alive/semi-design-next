<script lang="ts">
    import { JsonViewer } from '@fibrae/semi-ui-svelte';

    const data = `{
    "name": "Semi",
    "version": "0.0.0"
}`;
    const wrapperStyle = 'margin-bottom: 12px; overflow: hidden';
</script>

<div>
    <div style={wrapperStyle}>
        <JsonViewer height={100} options={{ lineHeight: 20 }} value={data} width={700} />
    </div>
    <div style={wrapperStyle}>
        <JsonViewer height={120} options={{ lineHeight: 24 }} value={data} width={700} />
    </div>
    <div style={wrapperStyle}>
        <JsonViewer height={120} options={{ lineHeight: 26 }} value={data} width={700} />
    </div>
</div>
