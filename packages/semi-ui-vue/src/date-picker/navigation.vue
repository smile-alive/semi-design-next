<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-foundation/date-picker/constants';
    import { IconChevronLeft, IconChevronRight, IconDoubleChevronLeft, IconDoubleChevronRight } from '@fibrae/semi-icons-vue';
    import Button from '../button/button.vue';
    import IconButton from '../icon-button/icon-button.vue';
    import type { DatePickerNavigationEmits, DatePickerNavigationProps } from './internal';

    const props = withDefaults(defineProps<DatePickerNavigationProps>(), {
        monthText: '',
        density: undefined,
        shouldBimonthSwitch: false,
        panelType: undefined,
        titleId: undefined,
    });

    const emit = defineEmits<DatePickerNavigationEmits>();

    const prefix = cssClasses.NAVIGATION;
    const iconSize = computed(() => (props.density === 'compact' ? 'default' : 'large'));
    const buttonSize = computed(() => (props.density === 'compact' ? 'small' : 'default'));

    // `visibility: hidden` keeps the icons in position
    const hidden = (panelType: string) => (props.shouldBimonthSwitch && props.panelType === panelType ? { visibility: 'hidden' as const } : undefined);
</script>

<template>
    <div :class="prefix">
        <IconButton :aria-label="props.locale.prevYear" noHorizontalPadding :size="buttonSize" :style="hidden(strings.PANEL_TYPE_RIGHT)" theme="borderless" @click="emit('prevYear')">
            <template #icon>
                <IconDoubleChevronLeft :size="iconSize" />
            </template>
        </IconButton>
        <IconButton :aria-label="props.locale.prevMonth" noHorizontalPadding :size="buttonSize" :style="hidden(strings.PANEL_TYPE_RIGHT)" theme="borderless" @click="emit('prevMonth')">
            <template #icon>
                <IconChevronLeft :size="iconSize" />
            </template>
        </IconButton>
        <div :class="`${prefix}-month`">
            <!-- names the month grid below (APG date picker dialog) -->
            <Button :id="props.titleId" :size="buttonSize" theme="borderless" @click="emit('monthClick', $event)">
                <span>{{ props.monthText }}</span>
            </Button>
        </div>
        <IconButton :aria-label="props.locale.nextMonth" noHorizontalPadding :size="buttonSize" :style="hidden(strings.PANEL_TYPE_LEFT)" theme="borderless" @click="emit('nextMonth')">
            <template #icon>
                <IconChevronRight :size="iconSize" />
            </template>
        </IconButton>
        <IconButton :aria-label="props.locale.nextYear" noHorizontalPadding :size="buttonSize" :style="hidden(strings.PANEL_TYPE_LEFT)" theme="borderless" @click="emit('nextYear')">
            <template #icon>
                <IconDoubleChevronRight :size="iconSize" />
            </template>
        </IconButton>
    </div>
</template>
