<script setup lang="ts">
    import { computed, onDeactivated, onMounted, shallowRef, useId, useTemplateRef, watch, type ComponentPublicInstance, type ShallowRef } from 'vue';
    import { format } from 'date-fns';
    import { cssClasses } from '@fibrae/semi-foundation/calendar/constants';
    import { toPercent } from '@fibrae/semi-foundation/calendar/event-util';
    import CalendarFoundation from '@fibrae/semi-foundation/calendar/foundation';
    import CalendarMonthFoundation, { type CalendarMonthAdapter } from '@fibrae/semi-foundation/calendar/month-foundation';
    import { IconClose } from '@fibrae/semi-icons-vue';
    import SlotFragment from '../_base/slot-fragment';
    import { hasSlotContent } from '../_base/slot-nodes';
    import useClickOutside from '../_base/use-click-outside';
    import useFoundation from '../_base/use-foundation';
    import useResizeObserver from '../_base/use-resize-observer';
    import IconButton from '../icon-button';
    import useLocale from '../locale/use-locale';
    import Popover from '../popover';
    import { useNestedPopups } from '../tooltip/context';
    import type { FocusTarget } from '../tooltip/interface';
    import { useCalendarContext } from './context';
    import type { CalendarSlots, EventObject, WeekStartsOn } from './interface';

    interface MonthCalendarProps {
        displayValue: Date;
        events: EventObject[];
        markWeekend: boolean;
        weekStartsOn: WeekStartsOn;
        today: number | null;
    }

    interface MonthCalendarState {
        showCard: Record<string, boolean>;
    }

    type Foundation = CalendarMonthFoundation<MonthCalendarProps, MonthCalendarState>;
    type Adapter = CalendarMonthAdapter<MonthCalendarProps, MonthCalendarState>;

    const props = defineProps<MonthCalendarProps>();

    const emit = defineEmits<{
        click: [event: MouseEvent, value: Date];
        close: [event: MouseEvent | KeyboardEvent | null];
        moreClick: [event: MouseEvent, date: Date, remaining: number];
    }>();

    defineSlots<Pick<CalendarSlots, 'header' | 'event' | 'dateDisplay' | 'dateGrid'>>();

    const i18n = useLocale('Calendar');
    const eventsByKey = useCalendarContext();

    const cardIdPrefix = useId();

    // The cards' and "more" buttons' DOM by key. A Map, not a single ref: a leaving card and the next opening one
    // coexist during the exit animation.
    const cards = new Map<string, HTMLElement | null>();
    const moreButtons = new Map<string, HTMLButtonElement | null>();
    const grid = useTemplateRef('grid');
    const itemLimit = shallowRef(0);

    const { foundation, state } = useFoundation<Foundation, Adapter, MonthCalendarProps, MonthCalendarState>(
        CalendarMonthFoundation,
        props,
        () => ({ showCard: {} }),
        (base) => ({
            notifyClose: (event, key) => {
                base.setState({ showCard: { ...base.getState('showCard'), [key]: false } });
                emit('close', event);
            },
            openCard: (key) => base.setState({ showCard: { [key]: true } }),
        })
    );

    const prefixCls = `${cssClasses.PREFIX}-month`;
    const cardCls = `${prefixCls}-event-card`;
    const openCardKey = computed(() => CalendarFoundation.getOpenCardKey(state.value.showCard));
    const monthlyData = computed(() => CalendarFoundation.getMonthlyData(props.displayValue, i18n.value.dateFnsLocale, props.weekStartsOn, props.today));
    const parsedEvents = computed(() => CalendarFoundation.getParseMonthlyEvents(props.events, props.displayValue, props.weekStartsOn));
    const weekCount = computed(() => Object.keys(monthlyData.value).length);

    // A day's events are a sparse array indexed by row, so the holes are dropped before listing or counting them.
    const weeks = computed(() =>
        Object.values(monthlyData.value).map((weekDays, weekInd) => {
            const parsed = parsedEvents.value[weekInd];
            return {
                // positioned spans always carry leftPos, width and topInd; the foundation type keeps them optional
                display: (parsed?.display ?? [])
                    .filter((item) => (item.topInd ?? 0) < itemLimit.value)
                    .map((item) => ({
                        item,
                        style: {
                            left: toPercent(item.leftPos ?? 0),
                            width: toPercent(item.width ?? 0),
                            top: `${item.topInd ?? 0}em`,
                        },
                    })),
                days: weekDays.map((day) => {
                    const dayEvents = parsed?.day[day.ind];
                    return {
                        ...day,
                        key: day.date.toString(),
                        // the key is the date string, which has spaces and so is no IDREF
                        titleId: `${cardIdPrefix}-${day.date.valueOf()}`,
                        events: (dayEvents ?? []).filter(Boolean),
                        hidden: CalendarFoundation.countHidden(dayEvents, itemLimit.value),
                    };
                }),
            };
        })
    );

    const isOpen = (key: string) => state.value.showCard[key] ?? false;

    // rows split the grid height evenly; the last row is measured because it always renders
    const measure = () => {
        const row = grid.value?.lastElementChild;
        if (row) {
            itemLimit.value = CalendarFoundation.getItemLimit(row.getBoundingClientRect().height);
        }
    };

    const eventOf = (parsed: EventObject) => eventsByKey?.value.get(parsed.key) ?? parsed;

    const setMoreButton = (key: string, el: Element | ComponentPublicInstance | null) => moreButtons.set(key, el as HTMLButtonElement | null);

    const setCard = (key: string, el: Element | ComponentPublicInstance | null) => cards.set(key, el as HTMLElement | null);

    const remaining = (count: number) => i18n.value.locale.remaining.replace('${remained}', String(count));

    // APG dialog: Esc and the close button hand focus back to "more" instead of dropping it with the card
    const closeCardToMore = (event: MouseEvent | KeyboardEvent, key: string) => {
        foundation.closeCard(event, key);
        moreButtons.get(key)?.focus();
    };

    const handleMoreClick = (event: MouseEvent, key: string, date: Date, count: number) => {
        if (isOpen(key)) {
            closeCardToMore(event, key);
            return;
        }
        foundation.showCard(key);
        emit('moreClick', event, date, count);
    };

    // IconButton exposes no focus method; its root element is the native button.
    const setInitialFocus = (focusRef: ShallowRef<FocusTarget | null>, el: unknown) => {
        focusRef.value = (el as ComponentPublicInstance | null)?.$el ?? null;
    };

    // The "more" button of the open card counts as inside: clicking it again closes the card through its click
    // instead of closing on mousedown and reopening on click.
    useClickOutside(
        [() => cards.get(openCardKey.value ?? ''), () => moreButtons.get(openCardKey.value ?? '')],
        () => {
            const key = openCardKey.value;
            if (key !== undefined && cards.get(key)) {
                foundation.closeCard(null, key);
            }
        },
        () => openCardKey.value !== undefined,
        useNestedPopups()
    );

    watch(weekCount, measure, { flush: 'post' });

    // Tooltip only reports a deactivation through update:visible, which this card ignores; close it here.
    onDeactivated(() => {
        const key = openCardKey.value;
        if (key !== undefined) {
            foundation.closeCard(null, key);
        }
    });

    onMounted(measure);

    useResizeObserver(grid, measure);

    watch(
        () => CalendarFoundation.isOpenCardStale(openCardKey.value, monthlyData.value, parsedEvents.value, itemLimit.value),
        (stale) => {
            if (stale) foundation.closeCard(null, openCardKey.value);
        }
    );
</script>

<template>
    <div :aria-label="format(props.displayValue, 'LLLL y', { locale: i18n.dateFnsLocale })" :class="prefixCls" role="table">
        <div :class="`${prefixCls}-sticky-top`" role="rowgroup">
            <div v-if="hasSlotContent($slots.header)" role="row">
                <div role="cell">
                    <slot name="header" />
                </div>
            </div>
            <div :class="`${prefixCls}-header`">
                <div :class="`${prefixCls}-grid`">
                    <div :class="`${prefixCls}-grid-row`" role="row">
                        <div v-for="day in monthlyData[0]" :key="day.weekday" :aria-label="day.weekday" :class="{ [`${cssClasses.PREFIX}-weekend`]: props.markWeekend && day.isWeekend }" role="columnheader">
                            <span>{{ day.weekday }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div :class="`${prefixCls}-grid-wrapper`" role="rowgroup">
            <div :class="`${prefixCls}-week`">
                <div ref="grid" :class="`${prefixCls}-grid-col`">
                    <div v-for="(week, weekInd) in weeks" :key="weekInd" :class="`${prefixCls}-weekrow`">
                        <div :class="`${prefixCls}-skeleton`" role="row">
                            <!-- a collapsed day is the anchor of its "more" card -->
                            <component :is="day.hidden > 0 ? Popover : SlotFragment" v-for="day in week.days" :key="day.date.valueOf()" :ariaLabelledby="day.titleId" position="leftTopOver" trigger="custom" :visible="isOpen(day.key)" @escKeyDown="closeCardToMore($event, day.key)">
                                <!-- Tooltip makes a trigger without a tabindex a tab stop; "more" is the stop -->
                                <div
                                    :aria-current="day.isToday ? 'date' : undefined"
                                    :aria-label="format(day.date, 'PPP', { locale: i18n.dateFnsLocale })"
                                    :class="{
                                        [`${cssClasses.PREFIX}-today`]: day.isToday,
                                        [`${cssClasses.PREFIX}-weekend`]: props.markWeekend && day.isWeekend,
                                        [`${prefixCls}-same`]: day.isSameMonth,
                                    }"
                                    role="cell"
                                    :tabindex="day.hidden > 0 ? -1 : undefined"
                                    @click="emit('click', $event, CalendarFoundation.formatCbValue([day.date]))"
                                >
                                    <slot :date="day.date" name="dateDisplay">
                                        <span :class="`${prefixCls}-date`">
                                            <template v-if="day.dayString === '1'">
                                                {{ day.month }}<span :class="`${cssClasses.PREFIX}-today-date`">&nbsp;{{ day.dayString }}</span
                                                >{{ i18n.locale.datestring }}
                                            </template>
                                            <span v-else :class="`${cssClasses.PREFIX}-today-date`">{{ day.dayString }}</span>
                                        </span>
                                    </slot>
                                    <button v-if="day.hidden > 0" :ref="(el) => setMoreButton(day.key, el)" :aria-expanded="isOpen(day.key)" aria-haspopup="dialog" :class="`${cardCls}-wrapper`" style="bottom: 0" type="button" @click.stop="handleMoreClick($event, day.key, day.date, day.hidden)">
                                        {{ remaining(day.hidden) }}
                                    </button>
                                    <slot :date="day.date" :dateString="day.date.toString()" name="dateGrid" />
                                </div>
                                <template v-if="day.hidden > 0" #content="{ initialFocusRef }">
                                    <div :ref="(el) => setCard(day.key, el)" :class="cardCls">
                                        <div :class="`${cardCls}-content`">
                                            <div :class="`${cardCls}-header`">
                                                <div :id="day.titleId" :class="`${cardCls}-header-info`">
                                                    <div :class="`${cardCls}-header-info-weekday`">
                                                        {{ day.weekday }}
                                                    </div>
                                                    <div :class="`${cardCls}-header-info-date`">
                                                        {{ day.dayString }}
                                                    </div>
                                                </div>
                                                <IconButton :ref="(el) => setInitialFocus(initialFocusRef, el)" :aria-label="i18n.locale.close" :class="`${cardCls}-close`" size="small" theme="borderless" type="tertiary" @click="closeCardToMore($event, day.key)">
                                                    <template #icon>
                                                        <IconClose />
                                                    </template>
                                                </IconButton>
                                            </div>
                                            <div :class="`${cardCls}-body`">
                                                <ul :class="`${cardCls}-list`">
                                                    <li v-for="item in day.events" :key="item.key || `${item.start}-event`">
                                                        <slot :event="eventOf(item)" name="event">{{ item.children }}</slot>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </component>
                        </div>
                        <!-- the overlay sits beside the row, where a list is not a valid child of the table -->
                        <div :class="`${cssClasses.PREFIX}-event-items`">
                            <div v-for="(span, ind) in week.display" :key="span.item.key || `${ind}-monthevent`" :class="[`${cssClasses.PREFIX}-event-item`, `${cssClasses.PREFIX}-event-month`]" :style="span.style">
                                <slot :event="eventOf(span.item)" name="event">{{ span.item.children }}</slot>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
