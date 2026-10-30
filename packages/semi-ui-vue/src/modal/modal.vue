<script setup lang="ts">
    import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, shallowRef, useTemplateRef, watch } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/modal/constants';
    import { isModal } from '@fibrae/semi-foundation/modal/modal-content-foundation';
    import ModalFoundation, { type ModalAdapter } from '@fibrae/semi-foundation/modal/modal-foundation';
    import { resolvePopupContainer } from '@fibrae/semi-foundation/utils/dom';
    import isPromise from '@fibrae/semi-foundation/utils/is-promise';
    import ReleaseHolder from '@fibrae/semi-foundation/utils/release-holder';
    import { lockBodyScroll } from '@fibrae/semi-foundation/utils/scroll-lock';
    import '@fibrae/semi-foundation/modal/modal.scss';
    import Portal from '../_base/portal.vue';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import Button from '../button';
    import useConfig from '../config-provider/use-config';
    import useLocale from '../locale/use-locale';
    import type { ModalButtonProps, ModalEmits, ModalHandle, ModalProps, ModalSlots, ModalState } from './interface';
    import ModalContent from './modal-content.vue';

    type FoundationProps = Omit<ModalProps, 'bodyStyle' | 'maskStyle'>;
    type Foundation = ModalFoundation<FoundationProps, ModalState, MouseEvent | KeyboardEvent, MouseEvent>;
    type Adapter = ModalAdapter<FoundationProps, ModalState, MouseEvent | KeyboardEvent, MouseEvent>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<ModalProps>(), {
        bodyStyle: semiGlobalDefault('Modal', 'bodyStyle'),
        cancelButtonProps: semiGlobalDefault('Modal', 'cancelButtonProps'),
        cancelLoading: semiGlobalDefault('Modal', 'cancelLoading'),
        cancelText: semiGlobalDefault('Modal', 'cancelText'),
        centered: () => semiDefault('Modal', 'centered', false),
        closable: () => semiDefault('Modal', 'closable', true),
        closeOnEsc: () => semiDefault('Modal', 'closeOnEsc', true),
        confirmLoading: semiGlobalDefault('Modal', 'confirmLoading'),
        footerFill: semiGlobalDefault('Modal', 'footerFill'),
        fullScreen: () => semiDefault('Modal', 'fullScreen', false),
        getPopupContainer: undefined,
        hasCancel: () => semiDefault('Modal', 'hasCancel', true),
        height: semiGlobalDefault('Modal', 'height'),
        keepDOM: () => semiDefault('Modal', 'keepDOM', false),
        lazyRender: () => semiDefault('Modal', 'lazyRender', true),
        mask: () => semiDefault('Modal', 'mask', true),
        maskClosable: () => semiDefault('Modal', 'maskClosable', true),
        maskFixed: () => semiDefault('Modal', 'maskFixed', false),
        maskStyle: semiGlobalDefault('Modal', 'maskStyle'),
        modalContentClass: semiGlobalDefault('Modal', 'modalContentClass'),
        motion: () => semiDefault('Modal', 'motion', true),
        okButtonProps: semiGlobalDefault('Modal', 'okButtonProps'),
        okText: semiGlobalDefault('Modal', 'okText'),
        okType: () => semiDefault('Modal', 'okType', 'primary'),
        preventScroll: semiGlobalDefault('Modal', 'preventScroll'),
        size: () => semiDefault('Modal', 'size', 'small'),
        title: semiGlobalDefault('Modal', 'title'),
        visible: () => semiDefault('Modal', 'visible', false),
        width: semiGlobalDefault('Modal', 'width'),
        zIndex: () => semiDefault('Modal', 'zIndex', 1000),
        onCancel: undefined,
        onOk: undefined,
    });

    const emit = defineEmits<ModalEmits>();
    const slots = defineSlots<ModalSlots>();

    const semi = useSemiGlobal();
    const config = useConfig();
    const locale = useLocale('Modal');

    const content = useTemplateRef('content');
    const scroll = new ReleaseHolder();
    const displayNone = shallowRef(!props.visible);
    const haveRendered = shallowRef(false);

    // Starts true for a modal mounted visible: inside a post flush its mount hook runs late, and a close before then must
    // still report afterClose.
    let closePending = props.visible;

    // KeepAlive: release the scroll lock on deactivation without closing, retake it on reactivation
    const active = shallowRef(true);

    const prefix = cssClasses.DIALOG;
    const okFn = computed(() => props.onOk ?? readSemiDefault(semi, 'Modal', 'onOk'));
    const cancelFn = computed(() => props.onCancel ?? readSemiDefault(semi, 'Modal', 'onCancel'));
    const getContainer = computed(() => props.getPopupContainer ?? readSemiDefault(semi, 'Modal', 'getPopupContainer'));

    // without motion the animation end arrives a flush late, so hidden does not wait for it
    const hidden = computed(() => (props.visible ? false : !props.motion || displayNone.value));
    const shouldRender = computed(() => props.visible || (props.keepDOM && (!props.lazyRender || haveRendered.value)) || (props.motion && !hidden.value));

    // default and footer are rendered by Modal itself
    const passedSlots = () => Object.keys(slots).filter((name) => name !== 'default' && name !== 'footer');

    const closeAfter = (result: unknown) => {
        if (isPromise(result)) {
            (result as Promise<unknown>).then(
                () => emit('update:visible', false),
                // the foundation rethrows the rejection; only skip the close
                () => {}
            );
        } else {
            emit('update:visible', false);
        }
    };

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, ModalState>(
        ModalFoundation,
        props,
        () => ({}),
        () => ({
            // the page keeps scrolling behind a non-modal dialog (no mask, or a mask confined to a custom container)
            disabledBodyScroll: () => {
                const inBody = resolvePopupContainer(getContainer.value ?? config.value.getPopupContainer) === document.body;
                if (isModal({ mask: props.mask, maskFixed: props.maskFixed, inBody })) {
                    scroll.hold(lockBodyScroll);
                } else {
                    scroll.release();
                }
            },
            enabledBodyScroll: () => scroll.release(),
            notifyCancel: (event) => {
                const result = cancelFn.value?.(event);
                closeAfter(result);
                return result;
            },
            notifyOk: (event) => okFn.value?.(event),
            notifyClose: () => emit('afterClose'),
            toggleDisplayNone: (hidden) => {
                displayNone.value = hidden;
            },
        })
    );

    const cancel = (event: MouseEvent | KeyboardEvent) => foundation.handleCancel(event);

    const takePendingClose = () => {
        const pending = closePending;
        closePending = false;
        return pending;
    };

    // autoFocus only selects the initially focused button and never reaches the DOM; data-type locates the button for it
    const footerButton = (kind: 'cancel' | 'ok', custom?: ModalButtonProps) => {
        const { autoFocus: _autoFocus, ...rest } = custom ?? {};
        const pending = kind === 'ok' ? state.value.onOKReturnPromiseStatus : state.value.onCancelReturnPromiseStatus;
        const own = kind === 'ok' ? props.confirmLoading : props.cancelLoading;
        return {
            type: kind === 'ok' ? props.okType : ('tertiary' as const),
            theme: kind === 'ok' ? ('solid' as const) : undefined,
            block: props.footerFill,
            loading: own === undefined ? pending === 'pending' : own,
            ...rest,
            'data-type': kind,
            style: kind === 'cancel' && props.footerFill ? [{ marginInlineStart: 'unset' }, rest.style] : rest.style,
        };
    };

    const cancelProps = computed(() => footerButton('cancel', props.cancelButtonProps));
    const okProps = computed(() => footerButton('ok', props.okButtonProps));

    const initialFocus = (customFooter: boolean) => ModalFoundation.getInitialFocus({ customFooter, okButtonProps: props.okButtonProps, hasCancel: props.hasCancel, cancelButtonProps: props.cancelButtonProps });

    // pre flush: showing reaches the DOM with `visible`; hiding waits for the leave animation
    watch(
        () => props.visible,
        (visible) => {
            if (visible) displayNone.value = false;
        }
    );

    watch(
        shouldRender,
        (render) => {
            if (render) haveRendered.value = true;
        },
        { immediate: true }
    );

    watch(
        () => hidden.value,
        (isHidden) => {
            if (!isHidden) return;
            // without motion the content unmounts with no leave, so no after-leave records the hide; a later switch to
            // motion would otherwise mount an invisible full-page wrap
            displayNone.value = true;
            if (takePendingClose()) foundation.afterClose();
        },
        { flush: 'post' }
    );

    onDeactivated(() => {
        active.value = false;
    });

    onActivated(() => {
        active.value = true;
    });

    // Created once mounted: the immediate run resolves getPopupContainer, whose in-tree target exists only then.
    onMounted(() =>
        watch(
            () => !hidden.value && active.value,
            (shown, _, onCleanup) => {
                if (!shown) return;
                closePending = true;
                foundation.beforeShow();
                onCleanup(foundation.afterHide);
            },
            { immediate: true, flush: 'post' }
        )
    );

    // emitted before unmount, since Vue drops emits after it
    onBeforeUnmount(() => {
        if (takePendingClose()) foundation.afterClose();
    });

    defineExpose<ModalHandle>({
        get root() {
            return content.value?.root ?? null;
        },
    });
</script>

<template>
    <Portal v-if="shouldRender" :getPopupContainer="getContainer" :zIndex="props.zIndex">
        <template #default="{ inBody }">
            <ModalContent
                ref="content"
                v-bind="$attrs"
                :bodyStyle="props.bodyStyle"
                :centered="props.centered"
                :class="{ [`${prefix}-displayNone`]: props.keepDOM && hidden }"
                :closable="props.closable"
                :closeOnEsc="props.closeOnEsc"
                :contentClass="props.modalContentClass"
                :height="props.height"
                :inBody="inBody"
                :initialFocus="initialFocus(Boolean($slots.footer))"
                :isFullScreen="props.fullScreen"
                :mask="props.mask"
                :maskClosable="props.maskClosable"
                :maskFixed="props.maskFixed"
                :maskStyle="props.maskStyle"
                :motion="props.motion"
                :onAfterLeave="() => foundation.toggleDisplayNone(true)"
                :onClose="cancel"
                :preventScroll="props.preventScroll"
                :size="props.size"
                :title="props.title"
                :visible="props.visible"
                :width="props.width"
            >
                <template v-for="name in passedSlots()" #[name]="scope">
                    <slot :name="name as keyof ModalSlots" v-bind="scope" />
                </template>
                <template #footer>
                    <slot v-if="$slots.footer" name="footer" />
                    <div v-else :class="{ [`${prefix}-footerfill`]: props.footerFill }">
                        <Button v-if="props.hasCancel" v-bind="cancelProps" @click="cancel">
                            {{ props.cancelText || locale.locale.cancel }}
                        </Button>
                        <Button v-bind="okProps" @click="foundation.handleOk">
                            {{ props.okText || locale.locale.confirm }}
                        </Button>
                    </div>
                </template>
                <slot />
            </ModalContent>
        </template>
    </Portal>
</template>
