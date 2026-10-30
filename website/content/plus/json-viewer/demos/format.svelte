<script lang="ts">
    import { Button, JsonViewer, type JsonViewerHandle } from '@fibrae/semi-ui-svelte';

    const data = `{
  "name": "Semi",
  "version": "0.0.0"
}`;
    const options = { formatOptions: { tabSize: 4, insertSpaces: true, eol: '\n' } };

    let jsonviewer = $state<JsonViewerHandle>();
</script>

<div>
    <Button onclick={() => jsonviewer?.format()}>格式化</Button>
    <div style="margin-bottom: 16px; margin-top: 16px">
        <JsonViewer bind:this={jsonviewer} height={100} {options} value={data} width={700} />
    </div>
</div>
