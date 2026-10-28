import { Node } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import NodeViewProbe from './node-view-probe.vue';

export default Node.create({
    name: 'probeNode',
    group: 'inline',
    inline: true,
    atom: true,
    parseHTML: () => [{ tag: 'probe-node' }],
    renderHTML: () => ['probe-node'],
    addNodeView: () => VueNodeViewRenderer(NodeViewProbe),
});
