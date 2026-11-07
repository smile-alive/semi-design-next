<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/calendar/constants';
    import { formatLocale } from '@fibrae/semi-foundation/locale/format';
    import useLocale from '../locale/use-locale';
    import type { CalendarSlots } from './interface';

    defineSlots<Pick<CalendarSlots, 'timeDisplay'>>();

    const i18n = useLocale('Calendar');

    const prefixCls = `${cssClasses.PREFIX}-time`;
    const hours = Array.from({ length: 24 }, (_, hour) => hour);

    const label = (hour: number) => formatLocale(hour < 12 ? i18n.value.locale.AM : i18n.value.locale.PM, { time: hour <= 12 ? hour : hour - 12 });
</script>

<template>
    <div :class="prefixCls" role="cell">
        <div :class="`${prefixCls}-items`">
            <div v-for="hour in hours" :key="hour" :class="`${prefixCls}-item`">
                <span v-if="hour === 0" />
                <span v-else>
                    <slot name="timeDisplay" :time="hour">{{ label(hour) }}</slot>
                </span>
            </div>
        </div>
    </div>
</template>
