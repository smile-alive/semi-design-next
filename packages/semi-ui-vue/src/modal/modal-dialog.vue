<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/modal/constants';
    import { IconClose } from '@fibrae/semi-icons-vue';
    import { hasSlotContent } from '../_base/slot-nodes';
    import IconButton from '../icon-button';
    import useLocale from '../locale/use-locale';
    import Typography from '../typography';
    import type { ModalDialogProps, ModalSlots } from './interface';

    const props = defineProps<ModalDialogProps>();
    const emit = defineEmits<{ close: [event: MouseEvent] }>();
    const slots = defineSlots<Omit<ModalSlots, 'modal'>>();

    const locale = useLocale('Modal');

    const prefix = cssClasses.DIALOG;

    const hasTitle = () => (slots.title ? hasSlotContent(slots.title) : props.title != null);

    const parts = () => ({ header: Boolean(slots.header), title: hasTitle(), icon: hasSlotContent(slots.icon) });

    // the title element exists only in the default header; aria-labelledby would shadow an aria-label
    const labelledby = (ariaLabel: unknown) => {
        const { header, title } = parts();
        return !ariaLabel && !header && title ? `${props.idPrefix}-title` : undefined;
    };
</script>

<template>
    <!-- tabindex lets the dialog itself take focus -->
    <div :aria-labelledby="labelledby($attrs['aria-label'])" :class="`${prefix}-content`" role="dialog" :tabindex="-1">
        <template v-for="(part, i) in [parts()]" :key="i">
            <slot v-if="part.header" name="header" />
            <div v-else :class="part.title ? `${prefix}-header` : `${prefix}-body-wrapper`">
                <span v-if="part.icon" :class="`${prefix}-icon-wrapper`" x-semi-prop="icon">
                    <slot name="icon" />
                </span>
                <!-- h5 look, h2 outline: the sheet's title is level 2 as well -->
                <Typography.Title v-if="part.title" :id="`${props.idPrefix}-title`" :class="`${prefix}-title`" component="h2" :heading="5" x-semi-prop="title">
                    <slot name="title">{{ props.title }}</slot>
                </Typography.Title>
                <div v-else :id="`${props.idPrefix}-body`" :class="[`${prefix}-body`, { [`${prefix}-withIcon`]: part.icon }]" :style="props.bodyStyle" x-semi-prop="children">
                    <slot />
                </div>
                <IconButton v-if="props.closable" :aria-label="locale.locale.close" :class="`${prefix}-close`" size="small" theme="borderless" type="tertiary" @click="emit('close', $event)">
                    <template #icon>
                        <slot name="closeIcon">
                            <IconClose x-semi-prop="closeIcon" />
                        </slot>
                    </template>
                </IconButton>
            </div>
            <div v-if="part.header || part.title" :id="`${props.idPrefix}-body`" :class="[`${prefix}-body`, { [`${prefix}-withIcon`]: part.icon }]" :style="props.bodyStyle" x-semi-prop="children">
                <slot />
            </div>
        </template>
        <div v-if="hasSlotContent($slots.footer)" :class="`${prefix}-footer`" x-semi-prop="footer">
            <slot name="footer" />
        </div>
    </div>
</template>
