<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import { Button, JsonViewer, type JsonViewerHandle } from '@fibrae/semi-ui-vue';

    const data = `{
  "name": "Semi",
  "version": "0.0.0"
}`;
    const options = { formatOptions: { tabSize: 4, insertSpaces: true, eol: '\n' } };

    const jsonviewer = useTemplateRef<JsonViewerHandle>('jsonviewer');
</script>

<template>
    <div>
        <Button @click="jsonviewer?.format()">格式化</Button>
        <div :style="{ marginBottom: '16px', marginTop: '16px' }">
            <JsonViewer ref="jsonviewer" :height="100" :modelValue="data" :options="options" :width="700" />
        </div>
    </div>
</template>
