<script setup lang="ts">
    import { computed } from 'vue';
    import type { NodeViewProps } from '@tiptap/core';
    import { NodeViewWrapper } from '@tiptap/vue-3';
    import { IconClose } from '@fibrae/semi-icons-vue';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';

    const props = defineProps<NodeViewProps>();

    const i18n = useLocale('AIChatInput');

    const label = computed(() => (props.node.attrs.label as string | null) ?? (props.node.attrs.value as string | null) ?? '');

    const remove = () => {
        props.deleteNode();
        // the button leaves with the slot, so focus would otherwise fall to the body
        props.editor.commands.focus();
    };
</script>

<template>
    <!-- a node view needs its wrapper as the root, so an empty skill renders an empty wrapper -->
    <NodeViewWrapper as="span" class="node-skillSlot">
        <span v-if="label !== ''" class="skill-slot-wrapper">
            <span class="skill-slot">
                {{ label }}
                <button :aria-label="i18n.locale.removeSkill" class="skill-slot-delete" type="button" @click.prevent.stop="remove">
                    <IconClose />
                </button>
            </span>
        </span>
    </NodeViewWrapper>
</template>
