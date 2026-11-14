<script setup lang="ts">
    import { computed, nextTick, onBeforeUnmount, shallowRef, useAttrs, useId, useTemplateRef, watch, type CSSProperties, type StyleValue } from 'vue';
    import { isNil, omitBy } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/components/side-sheet/constants';
    import SideSheetFoundation, { type SideSheetAdapter, type SideSheetState } from '@fibrae/semi-foundation/components/side-sheet/side-sheet-foundation';
    import { toCssLength } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/side-sheet/side-sheet.scss';
    import { IconClose } from '@fibrae/semi-icons-vue';
    import { semiDefault, readSemiDefault, semiGlobalDefault, useSemiGlobal, useFoundation, useKeepAliveFoundation } from '../../base/index';
    import { useOverlayResources } from '../../composables/index';
    import { Portal } from '../../internal/index';
    import { isAriaKey, splitControlAttrs, hasSlotContent } from '../../utils/index';
    import useConfig from '../config-provider/use-config';
    import IconButton from '../icon-button';
    import useLocale from '../locale/use-locale';
    import type { SideSheetEmits, SideSheetHandle, SideSheetProps, SideSheetSlots } from './interface';

    // the foundation reads none of these, and Vue's StyleValue is wider than its Record type
    type FoundationProps = Omit<SideSheetProps, 'classNames' | 'styles'>;
    type Foundation = SideSheetFoundation<FoundationProps>;
    type Adapter = SideSheetAdapter<FoundationProps>;

    // The root is a Portal, so the attrs are split by hand between the outer element and the dialog.
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<SideSheetProps>(), {
        canVerticalSetWidth: semiGlobalDefault('SideSheet', 'canVerticalSetWidth'),
        classNames: semiGlobalDefault('SideSheet', 'classNames'),
        closable: () => semiDefault('SideSheet', 'closable', true),
        closeOnEsc: () => semiDefault('SideSheet', 'closeOnEsc', false),
        disableScroll: () => semiDefault('SideSheet', 'disableScroll', true),
        getPopupContainer: undefined,
        height: semiGlobalDefault('SideSheet', 'height'),
        keepDOM: () => semiDefault('SideSheet', 'keepDOM', false),
        mask: () => semiDefault('SideSheet', 'mask', true),
        maskClosable: () => semiDefault('SideSheet', 'maskClosable', true),
        motion: () => semiDefault('SideSheet', 'motion', true),
        placement: () => semiDefault('SideSheet', 'placement', 'right'),
        size: () => semiDefault('SideSheet', 'size', 'small'),
        styles: semiGlobalDefault('SideSheet', 'styles'),
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
    const root = useTemplateRef<HTMLDivElement>('root');
    const dialog = useTemplateRef<HTMLDivElement>('dialog');

    // Kept by the Transition hooks: true once the dialog is shown and vShow has written its display back, false once the
    // leave has ended or the Portal unmounts it without one.
    const displayed = shallowRef(false);

    const prefix = cssClasses.PREFIX;
    const getContainer = computed(() => props.getPopupContainer ?? readSemiDefault(semi, 'SideSheet', 'getPopupContainer'));

    const { foundation } = useFoundation<Foundation, Adapter, FoundationProps, SideSheetState>(
        SideSheetFoundation,
        props,
        () => SideSheetFoundation.getInitialState(),
        () => ({
            notifyCancel: (event) => {
                emit('update:visible', false);
                emit('cancel', event);
            },
            notifyAfterVisibleChange: (isVisible) => emit('afterVisibleChange', isVisible),
            getRoot: () => root.value,
            getDialog: () => dialog.value,
        }),
        // the same container function Portal renders with
        { props: { getPopupContainer: () => getContainer.value }, context: () => config.value }
    );

    // A deactivated KeepAlive subtree gives up the page inert, scroll lock and focus trap without reporting a close.
    // Portal's hook runs after this one and re-teleports the content in the next render, which would drop a focus
    // placed before it, so init waits for that render.
    const keepAlive: ReturnType<typeof useKeepAliveFoundation> = useKeepAliveFoundation({
        connect: () => foundation.connect(),
        disconnect: () => foundation.disconnect(),
        init: () => void nextTick(() => keepAlive.isDeactivated() || foundation.init()),
        destroy: () => foundation.destroy(),
    });

    const hidden = computed(() => (props.visible ? false : !props.motion || !displayed.value));
    const shouldRender = computed(() => props.visible || props.keepDOM || (props.motion && !hidden.value));

    const onEnter = () => {
        displayed.value = true;
    };

    const onAfterLeave = () => {
        displayed.value = false;
    };

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
        // an attribute bound to undefined counts as unset, so it cannot replace a generated one
        const control = omitBy(splitControlAttrs(attrs, isAriaKey).control, isNil);
        return {
            // The title names the dialog unless the caller does; a generated reference would shadow aria-label.
            'aria-labelledby': !control['aria-label'] && hasTitle() ? titleId : undefined,
            'aria-modal': SideSheetFoundation.isModal({ mask: props.mask, inBody }) ? ('true' as const) : undefined,
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

    // vShow writes the display back only in the directive hook that starts the enter, and a post watch on visible runs
    // before that hook, so a keepDOM reopen would move focus into a display:none dialog; waiting for displayed also waits
    // for Portal, which renders a tick after this component mounts.
    useOverlayResources(
        foundation,
        () => props.visible,
        () => !hidden.value && displayed.value
    );

    // Unmounting the Portal removes a v-show element without a leave, so after-leave never resets displayed.
    watch(shouldRender, (rendered) => {
        if (!rendered) displayed.value = false;
    });

    watch(() => hidden.value, foundation.handleHiddenChange, { flush: 'post' });

    // Unmounting while shown or leaving counts as hiding; emitted before unmount, since Vue drops emits after it.
    onBeforeUnmount(() => foundation.handleHiddenChange(true));

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
                    <div v-if="props.mask" v-show="props.visible" aria-hidden="true" :class="[`${prefix}-mask`, props.classNames?.mask]" :style="props.styles?.mask" @click.self="onMaskClick" />
                </Transition>
                <Transition
                    appear
                    :css="props.motion"
                    :enterActiveClass="`${prefix}-animation-content_show_${props.placement}`"
                    :leaveActiveClass="`${prefix}-animation-content_hide_${props.placement}`"
                    :name="prefix"
                    type="animation"
                    @afterEnter="foundation.handleAnimationEnd"
                    @afterLeave="onAfterLeave"
                    @enter="onEnter"
                >
                    <div v-show="props.visible" ref="dialog" v-bind="dialogAttrs(inBody)" :class="[`${prefix}-inner`, `${prefix}-inner-wrap`, `${prefix}-size-${props.size}`, props.classNames?.content]" role="dialog" :style="[$attrs.style as StyleValue, props.styles?.content, dialogStyle()]" tabindex="-1">
                        <div :class="`${prefix}-content`">
                            <div :class="[`${prefix}-header`, props.classNames?.header]" :style="props.styles?.header">
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
                            <div :class="[`${prefix}-body`, props.classNames?.body]" :style="props.styles?.body" x-semi-prop="children">
                                <slot />
                            </div>
                            <div v-if="hasSlotContent($slots.footer)" :class="[`${prefix}-footer`, props.classNames?.footer]" :style="props.styles?.footer" x-semi-prop="footer">
                                <slot name="footer" />
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        </template>
    </Portal>
</template>
