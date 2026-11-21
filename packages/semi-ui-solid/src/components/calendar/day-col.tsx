import { For, Show, createMemo } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/calendar/constants';
import CalendarFoundation, { type CalendarAdapter, type CalendarBaseState } from '@fibrae/semi-foundation/components/calendar/foundation';
import { toCssLength } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/calendar/calendar.scss';
import { useFoundation } from '../../base/index';
import { mergeStyles } from '../../utils/index';
import ByKey from './by-key';
import EventContent from './event-content';
import type { DayColProps } from './interface';

const prefixCls = `${cssClasses.PREFIX}-grid`;
const hours = Array.from({ length: 25 }, (_, hour) => hour);

const pad = (d: number) => String(d).padStart(2, '0');

type Foundation = CalendarFoundation<DayColProps>;
type Adapter = CalendarAdapter<DayColProps>;

export default function DayCol(props: DayColProps) {
    const { state } = useFoundation<Foundation, Adapter, DayColProps, CalendarBaseState>(
        CalendarFoundation,
        props,
        () => CalendarFoundation.getInitialState(),
        () => ({})
    );

    // a new position restarts the line
    const currPos = createMemo(() => [state().currPos]);

    const currTop = (pos: number) => `${pos * props.scrollHeight}px`;

    const minEventHeight = () => props.minEventHeight ?? Number.MIN_SAFE_INTEGER;

    return (
        <div class={clsx(prefixCls, props.classNames?.day)} style={props.styles?.day} role="cell">
            <div class={`${prefixCls}-content`}>
                <Show when={(props.showCurrTime ?? true) && state().showCurrTime}>
                    <For each={currPos()}>
                        {(pos) => (
                            <>
                                <div class={clsx(`${prefixCls}-curr-circle`, props.classNames?.currentTimeDot)} style={mergeStyles({ top: currTop(pos) }, props.styles?.currentTimeDot)} />
                                <div class={clsx(`${prefixCls}-curr-line`, props.classNames?.currentTimeLine)} style={mergeStyles({ top: currTop(pos) }, props.styles?.currentTimeLine)} />
                            </>
                        )}
                    </For>
                </Show>
                <div class={clsx(`${prefixCls}-skeleton`, { [`${cssClasses.PREFIX}-weekend`]: props.isWeekend })}>
                    <For each={hours}>
                        {(hour) => (
                            <>
                                {/* pointer-only time slots: the cell has no keyboard way to pick a time, as before */}
                                <div class={`${prefixCls}-skeleton-row-line`} data-time={`${pad(hour)}:00:00`} onClick={(e) => props.handleClick(e, [props.displayValue, hour, 0, 0])} />
                                <div data-time={`${pad(hour)}:30:00`} onClick={(e) => props.handleClick(e, [props.displayValue, hour, 30, 0])} />
                            </>
                        )}
                    </For>
                </div>
                {props.dateGridRender?.(props.displayValue.toString(), props.displayValue)}
                <ul class={`${cssClasses.PREFIX}-event-items`}>
                    <ByKey each={props.events} by={(event) => event.key}>
                        {(event) => (
                            <li
                                class={clsx(`${cssClasses.PREFIX}-event-item ${cssClasses.PREFIX}-event-day`, props.classNames?.event)}
                                style={mergeStyles(
                                    {
                                        top: `${event().startPos * props.scrollHeight}px`,
                                        height: `${Math.max(minEventHeight(), (event().endPos - event().startPos) * props.scrollHeight)}px`,
                                        'inset-inline-start': toCssLength(event().left),
                                    },
                                    props.styles?.event
                                )}
                            >
                                <EventContent of={event().children} />
                            </li>
                        )}
                    </ByKey>
                </ul>
            </div>
        </div>
    );
}
