<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/calendar/constants';
    import useLocale from '../locale/use-locale';
    import type { CalendarSlots } from './interface';

    defineSlots<Pick<CalendarSlots, 'timeDisplay'>>();

    const i18n = useLocale('Calendar');

    const prefixCls = `${cssClasses.PREFIX}-time`;
    const hours = Array.from({ length: 24 }, (_, hour) => hour);

    const label = (hour: number) => (hour < 12 ? i18n.value.locale.AM.replace('${time}', String(hour)) : i18n.value.locale.PM.replace('${time}', String(hour === 12 ? hour : hour - 12)));
</script>

<template>
    <div :class="prefixCls" role="cell">
        <div :class="`${prefixCls}-items`">
            <div v-for="hour in hours" :key="hour" :class="`${prefixCls}-item`">
                <!-- the grid starts at 00:00, which has no label -->
                <span v-if="hour === 0" />
                <span v-else>
                    <slot name="timeDisplay" :time="hour">{{ label(hour) }}</slot>
                </span>
            </div>
        </div>
    </div>
</template>
