<script setup lang="ts">
    import { computed, type VNode } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/tag-input/constants';
    import { IconHandle } from '@fibrae/semi-icons-vue';
    import SlotFragment from '../_base/slot-fragment';
    import SortableHandle from '../_sortable/sortable-handle.vue';
    import useLocale from '../locale/use-locale';
    import Tag from '../tag';
    import { TypographyParagraph } from '../typography';
    import type { ShowTooltip } from '../typography/interface';
    import type { TagInputSize, TagInputTagSlotProps } from './interface';

    const props = withDefaults(
        defineProps<{
            value: string;
            index: number;
            size: TagInputSize;
            disabled?: boolean;
            showContentTooltip: boolean | ShowTooltip;
            /** the drag handles are on: the tag makes room for one */
            draggableActive: boolean;
            withHandle: boolean;
        }>(),
        { disabled: false }
    );

    const emit = defineEmits<{ close: [event?: Event] }>();
    defineSlots<{ tag?: (props: TagInputTagSlotProps) => VNode[] }>();

    const tagLocale = useLocale('Tag');

    const prefix = cssClasses.PREFIX;
    const ellipsis = computed(() => ({ showTooltip: props.showContentTooltip, rows: 1 }));

    // a function replacer keeps `$&` and `$$` in the value literal
    const tagLabel = () => (props.disabled ? undefined : tagLocale.value.locale.closableTag.replace('${tag}', () => String(props.value)));

    const close = (event?: Event) => emit('close', event);
</script>

<template>
    <!-- a closable Tag is a button and must not hold another one -->
    <component :is="props.withHandle ? 'div' : SlotFragment" :class="[`${prefix}-drag-item`, `${prefix}-wrapper-tag-icon`]">
        <SortableHandle v-if="props.withHandle"><IconHandle :class="`${prefix}-drag-handler`" /></SortableHandle>
        <slot v-if="$slots.tag" :index="props.index" name="tag" :onClose="close" :value="props.value" />
        <Tag
            v-else
            :aria-label="tagLabel()"
            :class="[`${prefix}-wrapper-tag`, `${prefix}-wrapper-tag-size-${props.size}`, { [`${prefix}-wrapper-tag-icon`]: props.draggableActive && !props.withHandle }]"
            :closable="!props.disabled"
            color="white"
            :size="props.size === 'small' ? 'small' : 'large'"
            type="light"
            visible
            @close="close"
        >
            <TypographyParagraph :class="[`${prefix}-wrapper-typo`, { [`${prefix}-wrapper-typo-disabled`]: props.disabled }]" :ellipsis="ellipsis">{{ props.value }}</TypographyParagraph>
        </Tag>
    </component>
</template>
