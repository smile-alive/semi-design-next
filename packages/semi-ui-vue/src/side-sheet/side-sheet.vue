<script setup lang="ts">
    import { computed, onActivated, onBeforeUnmount, onDeactivated, shallowRef, useAttrs, useId, useTemplateRef, watch, type CSSProperties, type StyleValue } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/side-sheet/constants';
    import SideSheetFoundation, { type SideSheetAdapter, type SideSheetState } from '@fibrae/semi-foundation/side-sheet/side-sheet-foundation';
    import { warnIfDialogUnnamed } from '@fibrae/semi-foundation/utils/a11y';
    import { coversPage, toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import FocusScope from '@fibrae/semi-foundation/utils/focus-scope';
    import { openLayer } from '@fibrae/semi-foundation/utils/layer';
    import ReleaseHolder from '@fibrae/semi-foundation/utils/release-holder';
    import { lockBodyScroll } from '@fibrae/semi-foundation/utils/scroll-lock';
    import '@fibrae/semi-foundation/side-sheet/side-sheet.scss';
    import { IconClose } from '@fibrae/semi-icons-vue';
    import { isAriaKey, splitControlAttrs } from '../_base/control-attrs';
    import Portal from '../_base/portal.vue';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import { hasSlotContent } from '../_base/slot-nodes';
    import useFoundation from '../_base/use-foundation';
    import useRecordFocus from '../_base/use-record-focus';
    import useConfig from '../config-provider/use-config';
    import IconButton from '../icon-button';
    import useLocale from '../locale/use-locale';
    import type { SideSheetEmits, SideSheetHandle, SideSheetProps, SideSheetSlots } from './interface';

    // the foundation reads none of these, and Vue's StyleValue is wider than its Record type
    type FoundationProps = Omit<SideSheetProps, 'bodyStyle' | 'headerStyle' | 'maskStyle'>;
    type Foundation = SideSheetFoundation<FoundationProps>;
    type Adapter = SideSheetAdapter<FoundationProps>;

    // The root is a Portal, so the attrs are split by hand between the outer element and the dialog.
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<SideSheetProps>(), {
        bodyStyle: semiGlobalDefault('SideSheet', 'bodyStyle'),
        canVerticalSetWidth: semiGlobalDefault('SideSheet', 'canVerticalSetWidth'),
        closable: () => semiDefault('SideSheet', 'closable', true),
        closeOnEsc: () => semiDefault('SideSheet', 'closeOnEsc', false),
        disableScroll: () => semiDefault('SideSheet', 'disableScroll', true),
        getPopupContainer: undefined,
        headerStyle: semiGlobalDefault('SideSheet', 'headerStyle'),
        height: semiGlobalDefault('SideSheet', 'height'),
        keepDOM: () => semiDefault('SideSheet', 'keepDOM', false),
        mask: () => semiDefault('SideSheet', 'mask', true),
        maskClosable: () => semiDefault('SideSheet', 'maskClosable', true),
        maskStyle: semiGlobalDefault('SideSheet', 'maskStyle'),
        motion: () => semiDefault('SideSheet', 'motion', true),
        placement: () => semiDefault('SideSheet', 'placement', 'right'),
        size: () => semiDefault('SideSheet', 'size', 'small'),
        title: semiGlobalDefault('SideSheet', 'title'),
        visible: semiGlobalDefault('SideSheet', 'visible'),
        width: semiGlobalDefault('SideSheet', 'width'),
        zIndex: () => semiDefault('SideSheet', 'zIndex', 1000),
    });

    const emit = defineEmits<SideSheetEmits>();
    const slots = defineSlots<SideSheetSlots>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const config = useConfig();
    const locale = useLocale('SideSheet');

    const titleId = useId();
    const root = useTemplateRef('root');
    const dialog = useTemplateRef('dialog');
    const scroll = new ReleaseHolder();
    const layer = new ReleaseHolder();
    const focusScope = new FocusScope();

    // Kept by the Transition hooks: true once the dialog is shown and vShow has written its display back, false once the
    // leave has ended or the Portal unmounts it without one.
    const displayed = shallowRef(false);

    // A deactivated KeepAlive subtree gives up the page inert, scroll lock and focus trap without reporting a close.
    const active = shallowRef(true);

    const prefix = cssClasses.PREFIX;
    const getContainer = computed(() => props.getPopupContainer ?? readSemiDefault(semi, 'SideSheet', 'getPopupContainer'));
    const hidden = computed(() => (props.visible ? false : !props.motion || !displayed.value));
    const shouldRender = computed(() => props.visible || props.keepDOM || (props.motion && !hidden.value));

    // The same container function Portal renders with, ConfigProvider's included. Only a mask over the whole page makes the
    // sheet modal: aria-modal, the inert page, the Tab trap, unconditional focus return and the body scroll lock. coversPage
    // does not throw for a container already gone, which happens when the sheet unmounts with it.
    const isModal = () => Boolean(props.mask) && coversPage(getContainer.value ?? config.value.getPopupContainer);

    const { foundation } = useFoundation<Foundation, Adapter, FoundationProps, SideSheetState>(
        SideSheetFoundation,
        props,
        () => ({}),
        () => ({
            disabledBodyScroll: () => (isModal() ? scroll.hold(lockBodyScroll) : scroll.release()),
            enabledBodyScroll: () => scroll.release(),
            notifyCancel: (event) => {
                emit('update:visible', false);
                emit('cancel', event);
            },
            notifyVisibleChange: (visible) => emit('afterVisibleChange', visible),
            openLayer: (onEscape) => layer.hold(() => openLayer({ element: root.value as HTMLElement, modal: isModal(), onEscape })),
            closeLayer: () => layer.release(),
            // Neither the browser nor Vue focuses an inserted autofocus element, so the sheet picks it before the default
            // (the dialog itself). A non-modal sheet leaves the page usable and Tab may leave it.
            // shortcut: a mask confined to a custom container still covers content under it that Tab can reach, upgrade
            // to inert on the container's other children if that content must become unreachable.
            trapFocus: () => {
                const el = dialog.value;
                if (!el) return;
                if (!el.contains(FocusTrapHandle.getActiveElement(el))) {
                    FocusTrapHandle.findAutofocus(el)?.focus({ preventScroll: true });
                }
                focusScope.engage(el, isModal(), true);
            },
            releaseFocus: () => focusScope.deactivate(),
            // A user who moved on to the page next to a non-modal sheet keeps that focus. Unlike React, Vue does not
            // refocus the pre-update element after the update, so restoring once in afterHide is enough.
            restoreFocus: () => focusScope.restoreIfAllowed(dialog.value, isModal(), true),
            toggleDisplayNone: (displayNone) => {
                displayed.value = !displayNone;
            },
        })
    );

    const onEnter = () => foundation.toggleDisplayNone(false);

    const onAfterLeave = () => foundation.toggleDisplayNone(true);

    const onMaskClick = (event: MouseEvent) => {
        if (props.maskClosable) foundation.handleCancel(event);
    };

    const onClose = (event: MouseEvent) => foundation.handleCancel(event);

    // aria-* go to the dialog (F12), style too as in React, the rest to the outer element.
    const hasTitle = () => (slots.title ? hasSlotContent(slots.title) : Boolean(props.title));

    const rootAttrs = () => {
        const { style: _style, ...rest } = splitControlAttrs(attrs, isAriaKey).root;
        return rest;
    };

    const dialogAttrs = (inBody: boolean) => {
        const { control } = splitControlAttrs(attrs, isAriaKey);
        return {
            // The title names the dialog unless the caller does; a generated reference would shadow aria-label.
            'aria-labelledby': !control['aria-label'] && hasTitle() ? titleId : undefined,
            'aria-modal': props.mask && inBody ? ('true' as const) : undefined,
            ...control,
        };
    };

    const isHorizontal = () => props.placement === 'top' || props.placement === 'bottom';

    const rootStyle = (): CSSProperties => {
        const { rootWidth } = SideSheetFoundation.getSheetSize(props);
        return rootWidth ? { width: toCssLength(rootWidth) } : {};
    };

    const dialogStyle = (): CSSProperties => {
        const { dialogWidth, dialogHeight } = SideSheetFoundation.getSheetSize(props);
        return {
            ...(dialogWidth ? { width: toCssLength(dialogWidth) } : {}),
            height: toCssLength(dialogHeight),
        };
    };

    useRecordFocus(focusScope, () => props.visible);

    // Unmounting the Portal removes a v-show element without a leave, so after-leave never resets displayed.
    watch(shouldRender, (rendered) => {
        if (!rendered) displayed.value = false;
    });

    // vShow writes the display back only in the directive hook that starts the enter, and a post watch on visible runs
    // before that hook, so a keepDOM reopen would move focus into a display:none dialog; waiting for displayed also waits
    // for Portal, which renders a tick after this component mounts. Post flush runs after Portal moves the dialog back on
    // reactivation.
    watch(
        () => Boolean(props.visible) && active.value && displayed.value,
        (shown, _, onCleanup) => {
            if (!shown) return;
            foundation.beforeShow();
            warnIfDialogUnnamed(dialog.value, 'SideSheet');
            onCleanup(() => foundation.afterHide());
        },
        { flush: 'post' }
    );

    watch(
        () => hidden.value,
        (isHidden) => foundation.onVisibleChange(!isHidden),
        { flush: 'post' }
    );

    onDeactivated(() => {
        active.value = false;
    });

    onActivated(() => {
        active.value = true;
    });

    // Unmounting while shown or leaving counts as hiding; emitted before unmount, since Vue drops emits after it.
    onBeforeUnmount(() => {
        if (!hidden.value) foundation.onVisibleChange(false);
    });

    defineExpose<SideSheetHandle>({
        get root() {
            return root.value;
        },
    });
</script>

<template>
    <Portal v-if="shouldRender" :getPopupContainer="getContainer" :zIndex="props.zIndex">
        <template #default="{ inBody }">
            <div
                ref="root"
                v-bind="rootAttrs()"
                :class="[
                    prefix,
                    `${prefix}-${props.placement}`,
                    {
                        [`${prefix}-popup`]: !inBody,
                        [`${prefix}-horizontal`]: isHorizontal(),
                        [`${prefix}-hidden`]: props.keepDOM && hidden,
                        [`${prefix}-fixed`]: !props.mask,
                        [`${prefix}-size-${props.size}`]: !props.mask,
                    },
                ]"
                :style="rootStyle()"
            >
                <Transition appear :css="props.motion" :enterActiveClass="`${prefix}-animation-mask_show`" :leaveActiveClass="`${prefix}-animation-mask_hide`" :name="prefix" type="animation">
                    <div v-if="props.mask" v-show="props.visible" aria-hidden="true" :class="`${prefix}-mask`" :style="props.maskStyle" @click.self="onMaskClick" />
                </Transition>
                <Transition appear :css="props.motion" :enterActiveClass="`${prefix}-animation-content_show_${props.placement}`" :leaveActiveClass="`${prefix}-animation-content_hide_${props.placement}`" :name="prefix" type="animation" @afterLeave="onAfterLeave" @enter="onEnter">
                    <div v-show="props.visible" ref="dialog" v-bind="dialogAttrs(inBody)" :class="[`${prefix}-inner`, `${prefix}-inner-wrap`, `${prefix}-size-${props.size}`]" role="dialog" :style="[$attrs.style as StyleValue, dialogStyle()]" tabindex="-1">
                        <div :class="`${prefix}-content`">
                            <div :class="`${prefix}-header`" :style="props.headerStyle">
                                <div v-if="hasTitle()" :id="titleId" aria-level="2" :class="`${prefix}-title`" role="heading" x-semi-prop="title">
                                    <slot name="title">{{ props.title }}</slot>
                                </div>
                                <IconButton v-if="props.closable" :aria-label="locale.locale.close" :class="`${prefix}-close`" size="small" theme="borderless" type="tertiary" @click="onClose">
                                    <template #icon>
                                        <slot name="closeIcon">
                                            <IconClose />
                                        </slot>
                                    </template>
                                </IconButton>
                            </div>
                            <div :class="`${prefix}-body`" :style="props.bodyStyle" x-semi-prop="children">
                                <slot />
                            </div>
                            <div v-if="hasSlotContent($slots.footer)" :class="`${prefix}-footer`" x-semi-prop="footer">
                                <slot name="footer" />
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        </template>
    </Portal>
</template>
