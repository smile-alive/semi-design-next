<script setup lang="ts">
    import { computed, isVNode, shallowRef, type FunctionalComponent, type ShallowRef, type VNode } from 'vue';
    import { settleConfirm } from '@fibrae/semi-foundation/modal/confirm';
    import { cssClasses } from '@fibrae/semi-foundation/modal/constants';
    import { createId } from '@fibrae/semi-foundation/utils/uuid';
    import type { EmitProps } from '../_base/element-props';
    import elementType from '../_base/element-type';
    import useConfig from '../config-provider/use-config';
    import type { ConfirmModalProps, ModalEmits } from './interface';
    import Modal from './modal.vue';

    // Modal's listeners reach it through attrs; typed behind `@vue-ignore` so callers can pass onAfterClose
    const props = withDefaults(defineProps<ConfirmModalProps & /* @vue-ignore */ EmitProps<ModalEmits>>(), {
        title: undefined,
        content: undefined,
        icon: undefined,
        closeIcon: undefined,
        header: undefined,
        footer: undefined,
        modalRender: undefined,
        direction: undefined,
        visible: undefined,
        onOk: undefined,
        onCancel: undefined,
    });

    const config = useConfig();

    const visible = shallowRef(true);
    const confirmLoading = shallowRef<boolean>();
    const cancelLoading = shallowRef<boolean>();

    const confirmCls = `${cssClasses.DIALOG}-confirm`;

    // not useId: it counts per render root, and every imperative confirm is its own root
    const contentId = createId('modal-confirm-content');

    // Modal.confirm renders outside any ConfigProvider and passes the direction itself
    const direction = computed(() => props.direction ?? config.value.direction);

    const settle = (result: unknown, loading: ShallowRef<boolean | undefined>) =>
        settleConfirm(result, {
            setLoading: (value) => {
                loading.value = value;
            },
            close: () => {
                visible.value = false;
            },
        });

    const iconSize = (node: unknown) => (isVNode(node) ? (node.props?.size ?? 'extra-large') : 'extra-large');

    const ok = (event: MouseEvent) => settle(props.onOk?.(event), confirmLoading);

    const cancel = (event: MouseEvent | KeyboardEvent) => settle(props.onCancel?.(event), cancelLoading);

    // stable component type: an inline function would remount the dialog on each render
    const ModalRender: FunctionalComponent<{ modal: VNode }> = (slotProps) => props.modalRender?.(slotProps.modal);
</script>

<template>
    <!-- APG alert dialog: described by its message -->
    <Modal :aria-describedby="contentId" :cancelLoading="cancelLoading" :class="confirmCls" :confirmLoading="confirmLoading" :dir="direction" :onCancel="cancel" :onOk="ok" role="alertdialog" :visible="props.visible ?? visible">
        <template v-if="props.title != null" #title>
            <span :class="`${confirmCls}-title-text`">
                <template v-if="typeof props.title === 'string'">{{ props.title }}</template>
                <component :is="props.title" v-else />
            </span>
        </template>
        <template v-if="props.icon" #icon>
            <template v-if="typeof props.icon === 'string'">{{ props.icon }}</template>
            <component :is="props.icon" v-else-if="elementType(props.icon) === 'Icon'" :class="[`${confirmCls}-icon`, `${cssClasses.DIALOG}-${props.type}-icon`]" :size="iconSize(props.icon)" />
            <component :is="props.icon" v-else />
        </template>
        <template v-if="props.header !== undefined" #header>
            <template v-if="typeof props.header === 'string'">{{ props.header }}</template>
            <component :is="props.header" v-else-if="props.header" />
        </template>
        <template v-if="props.footer !== undefined" #footer>
            <template v-if="typeof props.footer === 'string'">{{ props.footer }}</template>
            <component :is="props.footer" v-else-if="props.footer" />
        </template>
        <template v-if="props.closeIcon" #closeIcon>
            <template v-if="typeof props.closeIcon === 'string'">{{ props.closeIcon }}</template>
            <component :is="props.closeIcon" v-else />
        </template>
        <template v-if="props.modalRender" #modal="{ modal }">
            <ModalRender :modal="modal" />
        </template>
        <div :id="contentId" :class="[`${confirmCls}-content`, { [`${confirmCls}-content-withIcon`]: props.icon }]" x-semi-prop="content">
            <template v-if="typeof props.content === 'string'">{{ props.content }}</template>
            <component :is="props.content" v-else-if="props.content" />
        </div>
    </Modal>
</template>
