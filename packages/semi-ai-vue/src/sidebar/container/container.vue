<script setup lang="ts">
    import { computed, onActivated, onDeactivated, shallowRef, useTemplateRef, watch, type ComponentPublicInstance } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import ContainerFoundation, { type ContainerAdapter, type ContainerProps as FoundationProps } from '@fibrae/semi-ai-foundation/sidebar/container-foundation';
    import { canRestoreFocus } from '@fibrae/semi-ai-foundation/sidebar/utils';
    import FocusScope from '@fibrae/semi-foundation/utils/focus-scope';
    import { openLayer } from '@fibrae/semi-foundation/utils/layer';
    import ReleaseHolder from '@fibrae/semi-foundation/utils/release-holder';
    import '@fibrae/semi-ai-foundation/sidebar/sidebar.scss';
    import { IconClose } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '@fibrae/semi-ui-vue/_base/element-props';
    import { groupRole } from '@fibrae/semi-ui-vue/_base/group-role';
    import SlotFragment from '@fibrae/semi-ui-vue/_base/slot-fragment';
    import { hasSlotContent } from '@fibrae/semi-ui-vue/_base/slot-nodes';
    import useFoundation from '@fibrae/semi-ui-vue/_base/use-foundation';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import { useLocale, useRecordFocus } from '@fibrae/semi-ui-vue/hooks';
    import { Resizable } from '@fibrae/semi-ui-vue/resizable/index';
    import type { ContainerEmits, ContainerHandle, ContainerProps, ContainerSlots } from './interface';

    // attrs go on the container element inside the optional Resizable wrapper
    defineOptions({ inheritAttrs: false });

    // style stays out: the foundation types it as an object, while here it is only an attr
    const props = withDefaults(defineProps<ContainerProps & /* @vue-ignore */ ElementProps<'div', keyof ContainerProps | EmitHandlers<ContainerEmits> | 'style'>>(), {
        visible: false,
        title: undefined,
        motion: true,
        resizable: true,
        minWidth: 150,
        maxWidth: undefined,
        defaultSize: undefined,
        showClose: true,
        closeOnEsc: false,
    });

    const emit = defineEmits<ContainerEmits>();
    defineSlots<ContainerSlots>();

    const locale = useLocale('Sidebar');

    const root = useTemplateRef('root');
    const resizable = useTemplateRef<ComponentPublicInstance>('resizable');
    const layer = new ReleaseHolder();
    const focusScope = new FocusScope();

    // Kept by the Transition hooks: true once the element has entered, false once its leave has ended. The element stays
    // mounted while true, so without motion the synchronous leave still reaches after-leave before it unmounts. It starts
    // at visible so the appear enter of an initially visible container reports no change.
    const displayed = shallowRef(props.visible);

    // A deactivated KeepAlive subtree leaves the page, so the container gives up its layer.
    const active = shallowRef(true);

    const prefix = cssClasses.SIDEBAR;
    const shouldRender = computed(() => props.visible || displayed.value);

    const resizableProps = computed(() =>
        props.resizable
            ? {
                  defaultSize: props.defaultSize,
                  enable: strings.DIRECTION,
                  maxWidth: props.maxWidth,
                  minWidth: props.minWidth,
              }
            : {}
    );

    // The layer covers the Resizable around the container when there is one: its drag handles are siblings of the
    // container, and a modal layer opened earlier would make them inert.
    const layerElement = () => (props.resizable ? (resizable.value?.$el as HTMLElement | undefined) : undefined) ?? (root.value as HTMLElement);

    const cancel = (event: MouseEvent | KeyboardEvent) => {
        emit('update:visible', false);
        emit('cancel', event);
    };

    const { foundation } = useFoundation<ContainerFoundation, ContainerAdapter, FoundationProps, Record<string, never>>(
        ContainerFoundation,
        props,
        () => ({}),
        () => ({
            notifyCancel: cancel,
            notifyVisibleChange: (visible) => emit('afterVisibleChange', visible),
            // the page beside the sidebar stays usable, so the layer is not modal
            openLayer: (onEscape) => layer.hold(() => openLayer({ element: layerElement(), modal: false, onEscape })),
            closeLayer: () => layer.release(),
            toggleDisplayNone: (displayNone) => {
                displayed.value = !displayNone;
            },
            restoreFocus: () => {
                if (canRestoreFocus(root.value)) {
                    focusScope.restore(true);
                }
            },
        })
    );

    // Focus is recorded before an element inside takes it, so a container visible from its first render also returns
    // focus on close.
    useRecordFocus(focusScope, () => props.visible);

    // The element joins the source because it renders only once visible; post flush runs once it is in the DOM.
    watch(
        () => props.visible && active.value && root.value !== null,
        (shown, _, onCleanup) => {
            if (!shown) return;
            foundation.beforeShow();
            onCleanup(() => foundation.afterHide());
        },
        { flush: 'post' }
    );

    // afterHide is not enough: a container hidden in the tick it mounted never ran beforeShow, yet focus may already be
    // inside it and would drop to the body on unmount.
    watch(
        () => props.visible,
        (visible) => {
            if (!visible) foundation.restoreFocus();
        },
        { flush: 'post' }
    );

    watch(displayed, (shown) => foundation.onVisibleChange(shown), { flush: 'post' });

    onDeactivated(() => {
        active.value = false;
    });

    onActivated(() => {
        active.value = true;
    });

    defineExpose<ContainerHandle>({
        get root() {
            return root.value;
        },
    });
</script>

<template>
    <component :is="props.resizable ? Resizable : SlotFragment" v-if="shouldRender" ref="resizable" v-bind="resizableProps">
        <Transition appear :css="props.motion" :enterActiveClass="`${prefix}-animation-content_show`" :leaveActiveClass="`${prefix}-animation-content_hide`" :name="prefix" type="animation" @afterLeave="foundation.handleAnimationEnd" @enter="foundation.handleAnimationEnd">
            <div v-show="props.visible" ref="root" v-bind="$attrs" :class="`${prefix}-container`" :role="groupRole($attrs)">
                <slot v-if="hasSlotContent($slots.header)" name="header" />
                <div v-else :class="`${prefix}-container-header`">
                    <div :class="`${prefix}-container-header-title`">
                        <slot name="title">{{ props.title }}</slot>
                    </div>
                    <Button v-if="props.showClose" :aria-label="locale.locale.close" :class="`${prefix}-container-header-closeBtn`" size="small" theme="borderless" type="tertiary" @click="cancel">
                        <template #icon>
                            <IconClose />
                        </template>
                    </Button>
                </div>
                <div :class="`${prefix}-container-content`">
                    <slot />
                </div>
            </div>
        </Transition>
    </component>
</template>
