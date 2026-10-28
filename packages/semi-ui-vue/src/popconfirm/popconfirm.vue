<script setup lang="ts">
    import { computed, shallowRef, useId, useTemplateRef, watch, type CSSProperties, type ShallowRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/popconfirm/constants';
    import PopconfirmFoundation, { type PopconfirmAdapter } from '@fibrae/semi-foundation/popconfirm/popconfirm-foundation';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import '@fibrae/semi-foundation/popconfirm/popconfirm.scss';
    import { IconAlertTriangle, IconClose } from '@fibrae/semi-icons-vue';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import { hasSlotContent } from '../_base/slot-nodes';
    import useFoundation from '../_base/use-foundation';
    import Button from '../button';
    import useConfig from '../config-provider/use-config';
    import useLocale from '../locale/use-locale';
    import Popover from '../popover';
    import type { PopoverProps } from '../popover/interface';
    import type { FocusTarget } from '../tooltip/interface';
    import type { PopconfirmButtonProps, PopconfirmEmits, PopconfirmHandle, PopconfirmProps, PopconfirmSlots, PopconfirmState } from './interface';

    type Foundation = PopconfirmFoundation<PopconfirmProps, PopconfirmState>;
    type Adapter = PopconfirmAdapter<PopconfirmProps, PopconfirmState>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<PopconfirmProps>(), {
        cancelButtonProps: semiGlobalDefault('Popconfirm', 'cancelButtonProps'),
        cancelText: semiGlobalDefault('Popconfirm', 'cancelText'),
        cancelType: () => semiDefault('Popconfirm', 'cancelType', 'tertiary'),
        defaultVisible: semiGlobalDefault('Popconfirm', 'defaultVisible'),
        disabled: () => semiDefault('Popconfirm', 'disabled', false),
        okButtonProps: semiGlobalDefault('Popconfirm', 'okButtonProps'),
        okText: semiGlobalDefault('Popconfirm', 'okText'),
        okType: () => semiDefault('Popconfirm', 'okType', 'primary'),
        prefixCls: () => semiDefault('Popconfirm', 'prefixCls', cssClasses.PREFIX),
        showCloseIcon: () => semiDefault('Popconfirm', 'showCloseIcon', true),
        // a confirmation is a dialog whatever opens it, hover and focus included, unlike a plain Popover (F12)
        role: () => semiDefault('Popconfirm', 'role', 'dialog'),
        stopPropagation: () => semiDefault('Popconfirm', 'stopPropagation', true),
        trigger: () => semiDefault('Popconfirm', 'trigger', 'click'),
        visible: semiGlobalDefault('Popconfirm', 'visible'),
        position: semiGlobalDefault('Popconfirm', 'position'),
        onCancel: undefined,
        onConfirm: undefined,
        showArrow: semiGlobalDefault('Popconfirm', 'showArrow'),
        autoAdjustOverflow: semiGlobalDefault('Popconfirm', 'autoAdjustOverflow'),
        motion: semiGlobalDefault('Popconfirm', 'motion'),
        closeOnEsc: semiGlobalDefault('Popconfirm', 'closeOnEsc'),
        returnFocusOnClose: semiGlobalDefault('Popconfirm', 'returnFocusOnClose'),
        guardFocus: semiGlobalDefault('Popconfirm', 'guardFocus'),
        arrowPointAtCenter: semiGlobalDefault('Popconfirm', 'arrowPointAtCenter'),
        clickToHide: semiGlobalDefault('Popconfirm', 'clickToHide'),
        disableArrowKeyDown: semiGlobalDefault('Popconfirm', 'disableArrowKeyDown'),
        disableFocusListener: semiGlobalDefault('Popconfirm', 'disableFocusListener'),
        keepDOM: semiGlobalDefault('Popconfirm', 'keepDOM'),
        condition: semiGlobalDefault('Popconfirm', 'condition'),
        mouseEnterDelay: semiGlobalDefault('Popconfirm', 'mouseEnterDelay'),
        mouseLeaveDelay: semiGlobalDefault('Popconfirm', 'mouseLeaveDelay'),
        contentClassName: semiGlobalDefault('Popconfirm', 'contentClassName'),
        spacing: semiGlobalDefault('Popconfirm', 'spacing'),
        arrowStyle: semiGlobalDefault('Popconfirm', 'arrowStyle'),
        ariaLabel: semiGlobalDefault('Popconfirm', 'ariaLabel'),
        ariaLabelledby: semiGlobalDefault('Popconfirm', 'ariaLabelledby'),
        ariaDescribedby: semiGlobalDefault('Popconfirm', 'ariaDescribedby'),
    });

    const emit = defineEmits<PopconfirmEmits>();
    const slots = defineSlots<PopconfirmSlots>();

    const semi = useSemiGlobal();
    const i18n = useLocale('Popconfirm');
    const context = useConfig();

    const popover = useTemplateRef('popover');
    const footer = useTemplateRef('footer');

    // Tooltip mounts the card only after `visible` turns true, so the focus request waits for the footer to exist.
    let pendingFocus: 'cancel' | 'ok' | null = null;

    const confirmFn = computed(() => props.onConfirm ?? readSemiDefault(semi, 'Popconfirm', 'onConfirm'));
    const cancelFn = computed(() => props.onCancel ?? readSemiDefault(semi, 'Popconfirm', 'onCancel'));

    // Tooltip moves focus to its initialFocusRef after the card opens, which would override a button focused here.
    // So the button is also handed to Tooltip as the initial target; a content ref is used only when no button wins.
    // Wrapped in an object because the template would unwrap a top-level ref before it reaches the slot.
    const contentSlotProps = { initialFocusRef: shallowRef<FocusTarget | null>(null) };
    const tooltip: { focusRef: ShallowRef<FocusTarget | null> | null } = { focusRef: null };
    const rtl = computed(() => context.value.direction === 'rtl');
    const popoverPosition = computed(() => props.position ?? (rtl.value ? 'bottomRight' : 'bottomLeft'));

    const forwarded = computed<PopoverProps>(() => ({
        ariaLabel: props.ariaLabel,
        arrowPointAtCenter: props.arrowPointAtCenter,
        arrowStyle: props.arrowStyle,
        autoAdjustOverflow: props.autoAdjustOverflow,
        clickToHide: props.clickToHide,
        closeOnEsc: props.closeOnEsc,
        condition: props.condition,
        contentClassName: props.contentClassName,
        disableArrowKeyDown: props.disableArrowKeyDown,
        disableFocusListener: props.disableFocusListener,
        guardFocus: props.guardFocus,
        keepDOM: props.keepDOM,
        motion: props.motion,
        mouseEnterDelay: props.mouseEnterDelay,
        mouseLeaveDelay: props.mouseLeaveDelay,
        returnFocusOnClose: props.returnFocusOnClose,
        role: props.role,
        showArrow: props.showArrow,
        spacing: props.spacing,
        stopPropagation: props.stopPropagation,
    }));

    const titleId = `${useId()}-title`;
    const contentId = `${titleId}-content`;

    const bindTooltipFocus = (focusRef: ShallowRef<FocusTarget | null>) => {
        tooltip.focusRef = focusRef;
    };

    const applyFocus = () => {
        if (!footer.value) return;
        if (pendingFocus) {
            const button = footer.value.querySelector<HTMLElement>(`[data-type=${pendingFocus}]`);
            button?.focus({ preventScroll: true });
            if (tooltip.focusRef) tooltip.focusRef.value = button;
            pendingFocus = null;
        } else if (tooltip.focusRef) {
            tooltip.focusRef.value = contentSlotProps.initialFocusRef.value;
        }
    };

    const hasTitle = () => (slots.title ? hasSlotContent(slots.title) : Boolean(props.title));

    const hasContent = () => {
        const content = slots.content;
        return content ? hasSlotContent(() => content(contentSlotProps)) : false;
    };

    const dialogNames = () => {
        const title = hasTitle();
        const content = hasContent();
        const own = props.ariaLabelledby || props.ariaLabel;
        return {
            ariaLabelledby: own ? props.ariaLabelledby : title ? titleId : content ? contentId : undefined,
            ariaDescribedby: props.ariaDescribedby || (title && content ? contentId : undefined),
        };
    };

    watch(footer, applyFocus, { flush: 'post' });

    const { foundation, state } = useFoundation<Foundation, Adapter, PopconfirmProps, PopconfirmState>(
        PopconfirmFoundation,
        props,
        () => ({ visible: props.defaultVisible || false, cancelLoading: false, confirmLoading: false }),
        (base) => ({
            setVisible: (visible) => base.setState({ visible }),
            updateConfirmLoading: (confirmLoading) => base.setState({ confirmLoading }),
            updateCancelLoading: (cancelLoading) => base.setState({ cancelLoading }),
            notifyConfirm: (event) => confirmFn.value?.(event),
            notifyCancel: (event) => cancelFn.value?.(event),
            notifyVisibleChange: (visible) => {
                emit('update:visible', visible);
                emit('visibleChange', visible);
            },
            focusCancelButton: () => {
                pendingFocus = 'cancel';
                applyFocus();
            },
            focusOkButton: () => {
                pendingFocus = 'ok';
                applyFocus();
            },
            focusPrevFocusElement: () => {
                pendingFocus = null;
                // focus that already left the card (Tab away from a focus trigger) stays where it went
                if (FocusTrapHandle.shouldRestoreFocus(footer.value?.closest('[popover]'), false)) popover.value?.focusTrigger();
            },
        })
    );

    const popoverVisible = computed(() => (props.visible !== undefined ? props.visible : state.value.visible));

    // autoFocus only selects the initially focused button, so it never reaches the DOM. type and theme may be
    // overridden; data-type locates the button for autoFocus and the pending loading guards against a second click.
    const footerButton = (kind: 'cancel' | 'ok', custom?: PopconfirmButtonProps) => {
        const { autoFocus: _autoFocus, ...rest } = custom ?? {};
        const pending = kind === 'ok' ? state.value.confirmLoading : state.value.cancelLoading;
        return {
            type: kind === 'ok' ? props.okType : props.cancelType,
            theme: kind === 'ok' ? ('solid' as const) : undefined,
            ...rest,
            'data-type': kind,
            loading: rest.loading || pending,
        };
    };

    const cancelProps = computed(() => footerButton('cancel', props.cancelButtonProps));
    const okProps = computed(() => footerButton('ok', props.okButtonProps));

    // Tooltip reports only Popconfirm's own requests, so focus follows the `visible` it is given, whoever set it
    if (popoverVisible.value) foundation.handlePopupOpen();

    watch(popoverVisible, (visible) => (visible ? foundation.handlePopupOpen() : foundation.handlePopupClose()));

    // a disabled Popconfirm renders no popup, so an open one reports the close instead of reopening when re-enabled
    watch(
        () => props.disabled,
        (disabled) => {
            if (disabled && popoverVisible.value) foundation.handleVisibleChange(false);
        }
    );

    defineExpose<PopconfirmHandle>({ focusTrigger: () => popover.value?.focusTrigger() });
</script>

<template>
    <slot v-if="props.disabled" />
    <Popover
        v-else
        ref="popover"
        v-bind="{ ...forwarded, ...dialogNames() }"
        :class="cssClasses.POPOVER"
        :position="popoverPosition"
        :trigger="props.trigger"
        :visible="popoverVisible"
        @afterClose="(...args) => emit('afterClose', ...args)"
        @afterOpen="emit('afterOpen')"
        @clickOutSide="(...args) => emit('clickOutSide', ...args)"
        @escKeyDown="(...args) => emit('escKeyDown', ...args)"
        @open="emit('open')"
        @visibleChange="foundation.handleVisibleChange($event)"
    >
        <slot />
        <template #content="slotProps">
            <!-- Keeps clicks inside the card from click listeners on the document, whatever stopPropagation says. -->
            <div :class="[props.prefixCls, $attrs.class]" :style="$attrs.style as CSSProperties" @click.stop @vue:before-mount="bindTooltipFocus(slotProps.initialFocusRef)">
                <div :class="`${props.prefixCls}-inner`">
                    <template v-for="(part, i) in [{ icon: !$slots.icon || hasSlotContent($slots.icon), title: hasTitle(), content: hasContent() }]" :key="i">
                        <div :class="`${props.prefixCls}-header`">
                            <i v-if="part.icon" :class="`${props.prefixCls}-header-icon`" x-semi-prop="icon">
                                <slot v-if="$slots.icon" name="icon" />
                                <IconAlertTriangle v-else size="extra-large" />
                            </i>
                            <div :class="`${props.prefixCls}-header-body`">
                                <div v-if="part.title" :id="titleId" :class="`${props.prefixCls}-header-title`" x-semi-prop="title">
                                    <slot name="title">{{ props.title }}</slot>
                                </div>
                            </div>
                            <Button v-if="props.showCloseIcon" :aria-label="i18n.locale.close" :class="`${props.prefixCls}-btn-close`" size="small" theme="borderless" :type="props.cancelType" @click="foundation.handleCancel($event)">
                                <template #icon>
                                    <IconClose />
                                </template>
                            </Button>
                        </div>
                        <div v-if="part.content" :id="contentId" :class="[`${props.prefixCls}-body`, { [`${props.prefixCls}-body-withIcon`]: part.icon }]" x-semi-prop="content">
                            <slot name="content" v-bind="contentSlotProps" />
                        </div>
                    </template>
                    <div ref="footer" :class="`${props.prefixCls}-footer`">
                        <Button v-bind="cancelProps" @click="foundation.handleCancel($event)">
                            {{ props.cancelText || i18n.locale.cancel }}
                        </Button>
                        <Button v-bind="okProps" @click="foundation.handleConfirm($event)">
                            {{ props.okText || i18n.locale.confirm }}
                        </Button>
                    </div>
                </div>
            </div>
        </template>
    </Popover>
</template>
