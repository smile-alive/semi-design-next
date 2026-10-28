<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/banner/constants';
    import BannerFoundation, { type BannerAdapter } from '@fibrae/semi-foundation/banner/foundation';
    import { findFocusAfter } from '@fibrae/semi-foundation/utils/focus-handover';
    import '@fibrae/semi-foundation/banner/banner.scss';
    import { IconAlertCircle, IconAlertTriangle, IconClose, IconInfoCircle, IconTickCircle } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault from '../_base/semi-default';
    import { hasSlotContent } from '../_base/slot-nodes';
    import useFocusHandover from '../_base/use-focus-handover';
    import useFoundation from '../_base/use-foundation';
    import IconButton from '../icon-button';
    import useLocale from '../locale/use-locale';
    import { TypographyParagraph, TypographyTitle } from '../typography';
    import type { BannerEmits, BannerProps, BannerSlots, BannerState } from './interface';

    type Foundation = BannerFoundation<BannerProps, BannerState, MouseEvent>;
    type Adapter = BannerAdapter<BannerProps, BannerState, MouseEvent>;

    // role="alert" must survive the consumer's attrs, so they are bound by hand ahead of it.
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<BannerProps & /* @vue-ignore */ ElementProps<'div', keyof BannerProps | EmitHandlers<BannerEmits>>>(), {
        bordered: () => semiDefault('Banner', 'bordered', false),
        fullMode: () => semiDefault('Banner', 'fullMode', true),
        title: undefined,
        type: () => semiDefault('Banner', 'type', 'info'),
    });

    const emit = defineEmits<BannerEmits>();
    const slots = defineSlots<BannerSlots>();

    const i18n = useLocale('Banner');

    // Closing removes the whole banner, so the element to land on is read before it goes.
    let focusAfterClose: HTMLElement | null = null;

    const { foundation, state } = useFoundation<Foundation, Adapter, BannerProps, BannerState>(
        BannerFoundation,
        props,
        () => ({ visible: true }),
        (base) => ({
            hide: () => base.setState({ visible: false }),
            notifyClose: (event) => emit('close', event),
        })
    );

    const handoverFocus = useFocusHandover(() => focusAfterClose);

    const prefix = cssClasses.PREFIX;

    const iconMap = {
        warning: IconAlertTriangle,
        success: IconTickCircle,
        info: IconInfoCircle,
        danger: IconAlertCircle,
    };

    // Slots are not reactive, so what depends on them is decided while rendering. A given slot replaces the default
    // even when it renders nothing, which is how a consumer hides the icon or the close button.
    const hasIcon = () => (slots.icon ? hasSlotContent(slots.icon) : props.type in iconMap);

    const hasCloseButton = () => !slots.closeIcon || hasSlotContent(slots.closeIcon);

    const hasTitle = () => (slots.title ? hasSlotContent(slots.title) : Boolean(props.title));

    const remove = (event: MouseEvent) => {
        const root = (event.currentTarget as HTMLElement).closest(`.${prefix}`);
        focusAfterClose = root && findFocusAfter(root);
        foundation.removeBanner(event);
    };
</script>

<template>
    <div v-if="state.visible" v-bind="$attrs" :class="[prefix, `${prefix}-${props.type}`, props.fullMode ? `${prefix}-full` : `${prefix}-in-container`, { [`${prefix}-bordered`]: !props.fullMode && props.bordered }]" role="alert">
        <div :ref="handoverFocus" :class="`${prefix}-content-wrapper`">
            <div :class="`${prefix}-content`">
                <div v-if="hasIcon()" :class="`${prefix}-icon`" x-semi-prop="icon">
                    <slot name="icon">
                        <component :is="iconMap[props.type]" :aria-label="i18n.locale[props.type]" size="large" />
                    </slot>
                </div>
                <div :class="`${prefix}-content-body`">
                    <TypographyTitle v-if="hasTitle()" :class="`${prefix}-title`" component="div" :heading="5" x-semi-prop="title">
                        <slot name="title">{{ props.title }}</slot>
                    </TypographyTitle>
                    <TypographyParagraph v-if="hasSlotContent($slots.description)" :class="`${prefix}-description`" component="div" x-semi-prop="description">
                        <slot name="description" />
                    </TypographyParagraph>
                </div>
            </div>
            <IconButton v-if="hasCloseButton()" :aria-label="i18n.locale.close" :class="`${prefix}-close`" size="small" theme="borderless" type="tertiary" @click.stop="remove($event)">
                <template #icon>
                    <slot name="closeIcon">
                        <IconClose x-semi-prop="closeIcon" />
                    </slot>
                </template>
            </IconButton>
        </div>
        <div v-if="hasSlotContent($slots.default)" :class="`${prefix}-extra`" x-semi-prop="children">
            <slot />
        </div>
    </div>
</template>
