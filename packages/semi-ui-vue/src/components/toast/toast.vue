<script setup lang="ts">
    import { computed, isVNode, onBeforeUnmount, onMounted, useTemplateRef, type Component } from 'vue';
    import { isAlertType } from '@fibrae/semi-foundation/base';
    import { cssClasses, getStackLayerTransform, numbers } from '@fibrae/semi-foundation/components/toast/constants';
    import ToastFoundation, { type ToastAdapter, type ToastState, type ToastType } from '@fibrae/semi-foundation/components/toast/toast-foundation';
    import { toCssLength } from '@fibrae/semi-foundation/utils';
    import { IconAlertCircle, IconAlertTriangle, IconClose, IconInfoCircle, IconTickCircle } from '@fibrae/semi-icons-vue';
    import { semiDefault, readSemiDefault, semiGlobalDefault, useSemiGlobal, useFoundation } from '../../base/index';
    import { useNoticeClose } from '../../composables/index';
    import { elementType } from '../../utils/index';
    import useConfig from '../config-provider/use-config';
    import IconButton from '../icon-button';
    import useLocale from '../locale/use-locale';
    import { useToastListContext } from './context';
    import type { ToastItemEmits, ToastItemProps } from './interface';

    type Foundation = ToastFoundation<ToastItemProps>;
    type Adapter = ToastAdapter<ToastItemProps>;

    // The root is a wrapper element (the zero-height wrapper when stacked), so attrs go to the .semi-toast element.
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<ToastItemProps>(), {
        content: undefined,
        icon: undefined,
        type: semiGlobalDefault('Toast', 'type'),
        theme: () => semiDefault('Toast', 'theme', 'normal'),
        duration: () => semiDefault('Toast', 'duration', numbers.duration),
        textMaxWidth: () => semiDefault('Toast', 'textMaxWidth', 450),
        showClose: () => semiDefault('Toast', 'showClose', true),
        motion: () => semiDefault('Toast', 'motion', true),
        direction: semiGlobalDefault('Toast', 'direction'),
        stack: false,
        stackExpanded: false,
    });

    const emit = defineEmits<ToastItemEmits>();

    const semi = useSemiGlobal();
    const config = useConfig();
    const locale = useLocale('Toast');
    const list = useToastListContext();

    const toastEl = useTemplateRef('toastEl');
    let unregister: (() => void) | undefined;

    const { foundation } = useFoundation<Foundation, Adapter, ToastItemProps, ToastState>(
        ToastFoundation,
        props,
        () => ({}),
        () => ({
            notifyWrapperToRemove: (id) => emit('remove', id),
            notifyClose: () => emit('close'),
        })
    );

    const prefix = cssClasses.PREFIX;

    const typeIcons: Partial<Record<ToastType, Component>> = {
        warning: IconAlertTriangle,
        success: IconTickCircle,
        info: IconInfoCircle,
        error: IconAlertCircle,
    };

    const content = computed(() => props.content ?? readSemiDefault(semi, 'Toast', 'content', ''));
    const icon = computed(() => props.icon ?? readSemiDefault(semi, 'Toast', 'icon'));
    const typeIcon = computed(() => (props.type ? typeIcons[props.type] : undefined));
    const direction = computed(() => props.direction || config.value.direction);
    const isAlert = computed(() => isAlertType(props.type));
    const role = computed(() => (isAlert.value ? 'alert' : 'status'));
    const ariaLabel = computed(() => (props.type ? locale.value.locale[props.type] : locale.value.locale.default));
    const zeroHeightClass = computed(() => [`${prefix}-zero-height-wrapper`, { [`${prefix}-zero-height-wrapper-expanded`]: props.stackExpanded }]);

    const iconSize = (node: unknown) => (isVNode(node) ? (node.props?.size ?? 'large') : 'large');

    const close = (event: MouseEvent) => foundation.close(event);

    useNoticeClose(foundation, list?.state);

    onMounted(() => {
        if (list && props.id !== undefined && toastEl.value) unregister = list.register(props.id, toastEl.value);
    });

    onBeforeUnmount(() => unregister?.());
</script>

<template>
    <div :class="[props.stack && zeroHeightClass, { [`${prefix}-no-motion`]: !props.motion }]">
        <!-- A status element inserted with its text is announced unreliably; the list's live region announces it -->
        <div
            ref="toastEl"
            v-bind="{ dir: direction, ...$attrs }"
            :aria-label="ariaLabel"
            :aria-live="isAlert ? undefined : 'off'"
            :class="[prefix, { [`${prefix}-${props.type}`]: props.type, [`${prefix}-light`]: props.theme === 'light' }]"
            :role="role"
            :style="{ transform: getStackLayerTransform(props.positionInList) }"
        >
            <div :class="`${prefix}-content`">
                <template v-if="icon && typeof icon === 'string'">{{ icon }}</template>
                <component :is="icon" v-else-if="elementType(icon) === 'Icon'" :class="`${prefix}-icon`" :size="iconSize(icon)" />
                <component :is="icon" v-else-if="icon" />
                <component :is="typeIcon" v-else-if="typeIcon" :class="[`${prefix}-icon`, `${prefix}-icon-${props.type}`]" size="large" />
                <span :class="`${prefix}-content-text`" :style="{ maxWidth: toCssLength(props.textMaxWidth) }" x-semi-prop="content">
                    <template v-if="typeof content === 'string'">{{ content }}</template>
                    <component :is="content" v-else-if="content" />
                </span>
                <div v-if="props.showClose" :class="`${prefix}-close-button`">
                    <IconButton :aria-label="locale.locale.close" size="small" theme="borderless" type="tertiary" @click="close">
                        <template #icon>
                            <IconClose x-semi-prop="icon" />
                        </template>
                    </IconButton>
                </div>
            </div>
        </div>
    </div>
</template>
