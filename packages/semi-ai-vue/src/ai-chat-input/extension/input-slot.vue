<script setup lang="ts">
    import { computed, shallowRef, useTemplateRef, watch } from 'vue';
    import type { NodeViewProps } from '@tiptap/core';
    import { NodeViewContent, NodeViewWrapper } from '@tiptap/vue-3';
    import { strings } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
    import { isSelectionInsideNode } from '@fibrae/semi-ai-foundation/ai-chat-input/extension/input-slot';
    import { useEventListener } from '@fibrae/semi-ui-vue/hooks';

    const props = defineProps<NodeViewProps>();

    // The node view skips prop updates during IME composition, so composition events drive this flag to keep the
    // placeholder off the live IME text. Capture phase: ProseMirror may stop propagation.
    const composing = shallowRef(false);

    // the absolute placeholder takes no space, so its width becomes the slot's minimum width
    const placeholderEl = useTemplateRef('placeholderEl');
    const placeholderWidth = shallowRef<number>();

    const placeholder = computed(() => (props.node.attrs.placeholder as string | null) || '');
    const showPlaceholder = computed(() => props.node.textContent === strings.ZERO_WIDTH_CHAR && !composing.value);

    const editorDom = () => props.editor.view.dom;

    useEventListener(
        editorDom,
        'compositionstart',
        () => {
            if (isSelectionInsideNode(props.editor.state.selection, props.getPos(), props.node.nodeSize)) {
                composing.value = true;
            }
        },
        { capture: true }
    );

    useEventListener(editorDom, 'compositionend', () => (composing.value = false), { capture: true });

    watch(
        [showPlaceholder, placeholder],
        ([show], _, onCleanup) => {
            if (!show) {
                return;
            }
            const timer = setTimeout(() => {
                placeholderWidth.value = placeholderEl.value?.offsetWidth;
            });
            onCleanup(() => clearTimeout(timer));
        },
        { immediate: true, flush: 'post' }
    );
</script>

<template>
    <NodeViewWrapper as="span" class="node-inputSlot">
        <span class="input-slot" :style="{ minWidth: showPlaceholder && placeholderWidth ? `${placeholderWidth}px` : undefined }">
            <!-- hidden with display instead of unmounted so the DOM stays stable during IME updates -->
            <span ref="placeholderEl" class="input-slot-placeholder" contenteditable="false" data-placeholder="" :style="{ display: showPlaceholder ? undefined : 'none' }">{{ placeholder }}</span>
            <NodeViewContent as="span" class="content" />
        </span>
    </NodeViewWrapper>
</template>
