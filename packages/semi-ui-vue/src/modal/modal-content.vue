<script setup lang="ts">
    import { Transition, h, normalizeStyle, onActivated, onDeactivated, shallowRef, useAttrs, useId, useTemplateRef, vShow, watch, withDirectives, type CSSProperties, type ComponentPublicInstance, type TransitionProps } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/modal/constants';
    import ModalContentFoundation, { type ModalContentAdapter, isModal } from '@fibrae/semi-foundation/modal/modal-content-foundation';
    import { warnIfDialogUnnamed } from '@fibrae/semi-foundation/utils/a11y';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import FocusScope from '@fibrae/semi-foundation/utils/focus-scope';
    import { openLayer } from '@fibrae/semi-foundation/utils/layer';
    import ReleaseHolder from '@fibrae/semi-foundation/utils/release-holder';
    import { splitControlAttrs } from '../_base/control-attrs';
    import useFoundation from '../_base/use-foundation';
    import useRecordFocus from '../_base/use-record-focus';
    import type { ModalContentProps, ModalSlots } from './interface';
    import ModalDialog from './modal-dialog.vue';

    type FoundationProps = Omit<ModalContentProps, 'bodyStyle' | 'maskStyle'>;
    type Foundation = ModalContentFoundation<FoundationProps, MouseEvent>;
    type Adapter = ModalContentAdapter<FoundationProps, MouseEvent>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<ModalContentProps>(), {
        initialFocus: undefined,
        preventScroll: undefined,
    });

    const slots = defineSlots<ModalSlots>();
    const attrs = useAttrs();

    const root = useTemplateRef('root');
    const dialog = shallowRef<HTMLElement | null>(null);
    const focusScope = new FocusScope();
    const layer = new ReleaseHolder();
    let bodyFocus: HTMLElement | null = null;

    // Kept by the Transition hooks: true once the dialog is shown and vShow has restored its display, false once the leave
    // has ended
    const displayed = shallowRef(false);

    // KeepAlive: give up the layer and focus trap on deactivation without closing, retake them on reactivation
    const active = shallowRef(true);

    const idPrefix = `dialog-${useId()}`;
    const prefix = cssClasses.DIALOG;

    const { foundation } = useFoundation<Foundation, Adapter, FoundationProps, Record<string, unknown>>(
        ModalContentFoundation,
        props,
        () => ({}),
        () => ({
            notifyClose: (event) => props.onClose(event),
            openLayer: (onEscape) => layer.hold(() => openLayer({ element: root.value as HTMLElement, modal: isModal(props), onEscape })),
            closeLayer: () => layer.release(),
            trapFocus: () => {
                const el = dialog.value;
                if (!el) return;
                const { preventScroll } = props;
                const footer = el.querySelector(`:scope > .${prefix}-footer`);
                const active = FocusTrapHandle.getActiveElement(el);
                // Neither the browser nor Vue focuses an inserted autofocus element: pick the body element the first open
                // focused (a component's mount-time focus acts once, so a keepDOM reopen needs it), autofocus, footer
                // button, first. Known limit: keepDOM with lazyRender={false} that starts hidden mounts under display:none,
                // where mount-time focus fails, so nothing is remembered and the default button wins.
                if (el.contains(active)) {
                    if (active !== el && !footer?.contains(active)) {
                        bodyFocus ??= active as HTMLElement;
                    }
                } else {
                    FocusTrapHandle.pickInitialFocus(el, { remembered: bodyFocus, autofocus: true, footer, initialFocus: props.initialFocus })?.focus({ preventScroll });
                }
                focusScope.engage(el, isModal(props), preventScroll);
            },
            releaseFocus: () => {
                dialog.value?.blur();
                focusScope.deactivate();
            },
            restoreFocus: () => focusScope.restoreIfAllowed(dialog.value, isModal(props), props.preventScroll),
        })
    );

    const contentTransition = (): TransitionProps => ({
        name: prefix,
        appear: true,
        type: 'animation',
        css: props.motion,
        // the template compiler adds persisted for a v-show child; h() does not, and without it the renderer runs the
        // enter a second time on mount
        persisted: true,
        enterActiveClass: `${prefix}-content-animate-show`,
        leaveActiveClass: `${prefix}-content-animate-hide`,
        onEnter: () => {
            displayed.value = true;
        },
        onAfterLeave: () => {
            displayed.value = false;
            props.onAfterLeave();
        },
    });

    // F12: aria-* and role go to the dialog element, style to the .semi-modal box, the rest to the outer element
    const isDialogKey = (key: string) => key === 'role' || key.startsWith('aria-');

    const rootAttrs = () => {
        const { style: _style, ...rest } = splitControlAttrs(attrs, isDialogKey).root;
        return rest;
    };

    const dialogAttrs = () => ({
        'aria-modal': isModal(props) ? ('true' as const) : undefined,
        ...splitControlAttrs(attrs, isDialogKey).control,
        class: [
            props.contentClass,
            {
                [`${prefix}-content-fullScreen`]: props.isFullScreen,
                [`${prefix}-content-height-set`]: props.height || (normalizeStyle([attrs.style]) as CSSProperties | undefined)?.height,
            },
        ],
    });

    // only set keys, so an unset width does not wipe the caller's style
    const sizeStyle = (): CSSProperties => {
        if (props.isFullScreen) return { width: '100%', height: '100%', margin: 'unset' };
        return {
            ...(props.width ? { width: toCssLength(props.width) } : {}),
            ...(props.height ? { height: toCssLength(props.height) } : {}),
        };
    };

    const setDialog = (instance: unknown) => {
        dialog.value = (instance as ComponentPublicInstance | null)?.$el ?? null;
    };

    const close = (event: MouseEvent) => foundation.close(event);

    const dialogVNode = () =>
        h(Transition, contentTransition(), () =>
            withDirectives(
                h(
                    ModalDialog,
                    {
                        ...dialogAttrs(),
                        ref: setDialog,
                        bodyStyle: props.bodyStyle,
                        closable: props.closable,
                        idPrefix,
                        title: props.title,
                        onClose: close,
                    },
                    { ...slots }
                ),
                [[vShow, props.visible]]
            )
        );

    // record before the content's components take focus in their mounted hooks (an autofocusing Input)
    useRecordFocus(focusScope, () => props.visible);

    // Gated on `displayed`, not `visible`: vShow restores the display in its own post-flush hook, which runs after a watch
    // on `visible`, so focusing there would hit a display:none dialog on a keepDOM reopen. Post flush also runs after
    // Portal moves the nodes back on reactivation, so the inert is computed there.
    watch(
        () => displayed.value && active.value,
        (shown, _, onCleanup) => {
            if (!shown) return;
            foundation.show();
            warnIfDialogUnnamed(dialog.value, 'Modal');
            onCleanup(foundation.hide);
        },
        { flush: 'post' }
    );

    onDeactivated(() => {
        active.value = false;
    });

    onActivated(() => {
        active.value = true;
    });

    defineExpose({ root });
</script>

<template>
    <div
        ref="root"
        v-bind="rootAttrs()"
        :class="{
            [`${prefix}-no-mask`]: !props.mask,
            [`${prefix}-popup`]: !props.inBody && !props.maskFixed,
            [`${prefix}-fixed`]: props.maskFixed,
        }"
    >
        <Transition appear :css="props.motion" :enterActiveClass="`${prefix}-mask-animate-show`" :leaveActiveClass="`${prefix}-mask-animate-hide`" :name="prefix" type="animation">
            <div v-if="props.mask" v-show="props.visible" :class="`${prefix}-mask`" :style="props.maskStyle" />
        </Transition>
        <div :class="[`${prefix}-wrap`, { [`${prefix}-wrap-center`]: props.centered }]" role="none" @click="props.maskClosable && foundation.handleMaskClick($event)" @mouseup="props.maskClosable && foundation.handleMaskMouseUp()">
            <!-- marked only while the mask listens, since only its mouseup clears the mark -->
            <div :id="idPrefix" :class="[prefix, `${prefix}-${props.size}`, { [`${prefix}-centered`]: props.centered }]" :style="[$attrs.style as CSSProperties, sizeStyle()]" @mousedown="props.maskClosable && foundation.handleDialogMouseDown()">
                <slot v-if="$slots.modal" :modal="dialogVNode()" name="modal" />
                <Transition v-else v-bind="contentTransition()">
                    <ModalDialog v-show="props.visible" :ref="setDialog" v-bind="dialogAttrs()" :bodyStyle="props.bodyStyle" :closable="props.closable" :idPrefix="idPrefix" :title="props.title" @close="close">
                        <!-- forwarded only when given: ModalDialog renders a given #header even when empty, and a given #title replaces the title prop -->
                        <template v-if="$slots.header" #header>
                            <slot name="header" />
                        </template>
                        <template v-if="$slots.title" #title>
                            <slot name="title" />
                        </template>
                        <template v-if="$slots.icon" #icon>
                            <slot name="icon" />
                        </template>
                        <template v-if="$slots.closeIcon" #closeIcon>
                            <slot name="closeIcon" />
                        </template>
                        <template #footer>
                            <slot name="footer" />
                        </template>
                        <slot />
                    </ModalDialog>
                </Transition>
            </div>
        </div>
    </div>
</template>
