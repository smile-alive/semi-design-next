<script setup lang="ts">
    import type { VNode } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/transfer/constants';
    import { IconClose, IconHandle } from '@fibrae/semi-icons-vue';
    import SortableHandle from '../../internal/sortable/sortable-handle.vue';
    import useLocale from '../locale/use-locale';
    import type { TransferDataItem, TransferLabelSlotProps, TransferProps, TransferSelectedItemSlotProps } from './interface';

    const props = withDefaults(
        defineProps<{
            classNames?: TransferProps['classNames'];
            styles?: TransferProps['styles'];
            item: TransferDataItem;
            index: number;
            pathLabel?: string;
            disabled?: boolean;
            draggable: boolean;
            sortable: boolean;
        }>(),
        { classNames: undefined, styles: undefined, pathLabel: undefined, disabled: false }
    );

    const emit = defineEmits<{ remove: [] }>();

    defineSlots<{
        selectedItem?: (props: TransferSelectedItemSlotProps) => VNode[];
        label?: (props: TransferLabelSlotProps) => VNode[];
    }>();

    const locale = useLocale('Transfer');

    const prefixCls = cssClasses.PREFIX;

    const handle = () => (props.draggable ? SortableHandle : undefined);
</script>

<template>
    <div v-if="$slots.selectedItem" role="listitem">
        <slot :fullPath="props.item.fullPath" :handle="handle()" :index="props.index" :item="props.item" name="selectedItem" :onRemove="() => emit('remove')" />
    </div>
    <div v-else :class="[`${prefixCls}-item`, `${prefixCls}-right-item`, { [`${prefixCls}-right-item-draggable`]: props.draggable }, props.classNames?.item]" role="listitem" :style="props.styles?.item">
        <template v-if="props.draggable">
            <SortableHandle v-if="props.sortable">
                <IconHandle :class="[`${prefixCls}-right-item-drag-handler`, props.classNames?.itemDragHandle]" :style="props.styles?.itemDragHandle" />
            </SortableHandle>
            <IconHandle v-else aria-disabled="true" :aria-label="locale.locale.dragSort" :class="[`${prefixCls}-right-item-drag-handler`, props.classNames?.itemDragHandle]" role="button" :style="props.styles?.itemDragHandle" />
        </template>
        <div :class="`${prefixCls}-right-item-text`">
            <template v-if="props.pathLabel !== undefined">{{ props.pathLabel }}</template>
            <slot v-else :item="props.item" name="label">{{ props.item.label }}</slot>
        </div>
        <button :aria-label="locale.locale.remove" :class="[`${prefixCls}-item-close-icon`, { [`${prefixCls}-item-close-icon-disabled`]: props.item.disabled }, props.classNames?.itemRemove]" :disabled="props.item.disabled || props.disabled" :style="props.styles?.itemRemove" type="button" @click="emit('remove')">
            <IconClose />
        </button>
    </div>
</template>
