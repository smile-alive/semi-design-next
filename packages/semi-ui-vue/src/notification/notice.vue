<script setup lang="ts">
    import { computed, isVNode, useId, useTemplateRef, type Component } from 'vue';
    import { cssClasses, getStackItemTransform, numbers } from '@fibrae/semi-foundation/notification/constants';
    import NotificationFoundation, { type NoticeAdapter, type NoticePosition, type NoticeState, type NoticeType } from '@fibrae/semi-foundation/notification/notification-foundation';
    import { isAlertType, readNoticeText } from '@fibrae/semi-foundation/utils/announcer';
    import { IconAlertCircle, IconAlertTriangle, IconClose, IconInfoCircle, IconTickCircle } from '@fibrae/semi-icons-vue';
    import elementType from '../_base/element-type';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import useNoticeClose from '../_base/use-notice-close';
    import useConfig from '../config-provider/use-config';
    import IconButton from '../icon-button';
    import useLocale from '../locale/use-locale';
    import { useNoticeListContext } from './context';
    import type { NoticeHandle, NoticeProps } from './interface';

    /** Props of the single notice the list renders; list-level options are stripped before they reach it */
    interface NoticeItemProps extends Omit<NoticeProps, 'onClick' | 'onClose' | 'onCloseClick' | 'class' | 'style' | 'top' | 'bottom' | 'left' | 'right' | 'zIndex' | 'getPopupContainer' | 'stack' | 'position'> {
        placement: NoticePosition;
        stack?: boolean;
        stackExpanded?: boolean;
        /** Shown notices in front of this one, which sets how far it sinks behind them in a collapsed stack */
        depth?: number;
        /** z-index inside a stack, newest on top */
        layer?: number;
    }

    type Foundation = NotificationFoundation<NoticeItemProps>;
    type Adapter = NoticeAdapter<NoticeItemProps>;

    // The root is the wrapper the list animates (a zero-height item when stacked), so attrs go to the
    // .semi-notification-notice element itself.
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<NoticeItemProps>(), {
        id: '',
        title: undefined,
        content: undefined,
        icon: undefined,
        type: semiGlobalDefault('Notification', 'type'),
        theme: () => semiDefault('Notification', 'theme', 'normal'),
        duration: () => semiDefault('Notification', 'duration', numbers.duration),
        showClose: () => semiDefault('Notification', 'showClose', true),
        direction: semiGlobalDefault('Notification', 'direction'),
        stack: false,
        stackExpanded: false,
        depth: 0,
        layer: 0,
    });

    const emit = defineEmits<{
        close: [];
        closeClick: [id: string];
        remove: [id: string];
    }>();

    const semi = useSemiGlobal();
    const config = useConfig();
    const locale = useLocale('Notification');
    const list = useNoticeListContext();

    const noticeEl = useTemplateRef('noticeEl');

    const { foundation } = useFoundation<Foundation, Adapter, NoticeItemProps, NoticeState>(
        NotificationFoundation,
        props,
        () => ({}),
        () => ({
            notifyWrapperToRemove: (id) => emit('remove', id),
            notifyClose: () => emit('close'),
            notifyCloseClick: (id) => emit('closeClick', id),
        })
    );

    const prefix = cssClasses.NOTICE;
    const titleId = `${prefix}-title-${useId()}`;

    const typeIcons: Partial<Record<NoticeType, Component>> = {
        warning: IconAlertTriangle,
        success: IconTickCircle,
        info: IconInfoCircle,
        error: IconAlertCircle,
    };

    const title = computed(() => props.title ?? readSemiDefault(semi, 'Notification', 'title', ''));
    const content = computed(() => props.content ?? readSemiDefault(semi, 'Notification', 'content', ''));
    const icon = computed(() => props.icon ?? readSemiDefault(semi, 'Notification', 'icon'));
    const typeIcon = computed(() => (props.type ? typeIcons[props.type] : undefined));
    const direction = computed(() => props.direction || config.value.direction);
    const isAlert = computed(() => isAlertType(props.type));
    const role = computed(() => (isAlert.value ? 'alert' : 'status'));

    const stackItemStyle = computed(() => {
        const collapsed = !props.stackExpanded && props.depth > 0;
        return {
            zIndex: props.layer,
            transform: collapsed ? getStackItemTransform(props.depth, props.placement) : undefined,
        };
    });

    const announce = () => {
        if (isAlert.value) return;
        list?.value.announce(props.id, () => readNoticeText(noticeEl.value, prefix));
    };

    const iconSize = (node: unknown) => (isVNode(node) ? (node.props?.size ?? 'large') : 'large');

    const close = (event: MouseEvent) => foundation.clickClose(event);

    useNoticeClose(foundation, list, () => props.id, announce);

    defineExpose<NoticeHandle>({
        restartCloseTimer: foundation.restartCloseTimer,
        pauseCloseTimer: foundation.pauseCloseTimer,
        resumeCloseTimer: foundation.resumeCloseTimer,
    });
</script>

<template>
    <div
        :class="
            props.stack && [
                `${prefix}-stack-item`,
                {
                    [`${prefix}-stack-item-expanded`]: props.stackExpanded,
                    [`${prefix}-stack-item-hidden`]: !props.stackExpanded && props.depth >= numbers.stackVisibleCount,
                },
            ]
        "
        :style="props.stack ? stackItemStyle : undefined"
    >
        <!-- A status element inserted with its text is announced unreliably; the list's live region announces it -->
        <div
            ref="noticeEl"
            v-bind="{ dir: direction, ...$attrs }"
            :aria-labelledby="title ? titleId : undefined"
            :aria-live="isAlert ? undefined : 'off'"
            :class="[
                prefix,
                {
                    [`${prefix}-${props.type}`]: props.type,
                    [`${prefix}-light`]: props.theme === 'light',
                },
            ]"
            :role="role"
        >
            <div>
                <div v-if="icon || typeIcon" :class="[`${prefix}-icon`, `${prefix}-${props.type}`]" x-semi-prop="icon">
                    <component :is="typeIcon" v-if="!icon" size="large" />
                    <template v-else-if="typeof icon === 'string'">{{ icon }}</template>
                    <component :is="icon" v-else-if="elementType(icon) === 'Icon'" :size="iconSize(icon)" />
                    <component :is="icon" v-else />
                </div>
            </div>
            <div :class="`${prefix}-inner`">
                <div :class="`${prefix}-content-wrapper`">
                    <div v-if="title" :id="titleId" :class="`${prefix}-title`" x-semi-prop="title">
                        <template v-if="typeof title === 'string'">{{ title }}</template>
                        <component :is="title" v-else />
                    </div>
                    <div v-if="content" :class="`${prefix}-content`" x-semi-prop="content">
                        <template v-if="typeof content === 'string'">{{ content }}</template>
                        <component :is="content" v-else />
                    </div>
                </div>
                <IconButton v-if="props.showClose" :aria-label="locale.locale.close" :class="`${prefix}-icon-close`" size="small" theme="borderless" type="tertiary" @click="close">
                    <template #icon>
                        <IconClose />
                    </template>
                </IconButton>
            </div>
        </div>
    </div>
</template>
