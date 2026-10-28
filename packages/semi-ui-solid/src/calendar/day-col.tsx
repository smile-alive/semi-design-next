import { For, Show, createMemo } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/calendar/constants';
import CalendarFoundation, { type CalendarAdapter } from '@fibrae/semi-foundation/calendar/foundation';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import '@fibrae/semi-foundation/calendar/calendar.scss';
import useFoundation from '../_base/use-foundation';
import ByKey from './by-key';
import EventContent from './event-content';
import type { DayColProps } from './interface';

const prefixCls = `${cssClasses.PREFIX}-grid`;
const hours = Array.from({ length: 25 }, (_, hour) => hour);

const pad = (d: number) => String(d).padStart(2, '0');

interface DayColState {
    currPos: number;
    showCurrTime: boolean;
}

type Foundation = CalendarFoundation<DayColProps, DayColState>;
type Adapter = CalendarAdapter<DayColProps, DayColState>;

export default function DayCol(props: DayColProps) {
    const { state } = useFoundation<Foundation, Adapter, DayColProps, DayColState>(
        CalendarFoundation,
        props,
        () => ({ currPos: 0, showCurrTime: false }),
        (base) => ({
            updateCurrPos: (currPos) => base.setState({ currPos }),
            setShowCurrTime: (showCurrTime) => base.setState({ showCurrTime }),
        })
    );

    // a new position restarts the line
    const currPos = createMemo(() => [state().currPos]);

    const currTop = (pos: number) => `${pos * props.scrollHeight}px`;

    const minEventHeight = () => props.minEventHeight ?? Number.MIN_SAFE_INTEGER;

    return (
        <div class={prefixCls} role="cell">
            <div class={`${prefixCls}-content`}>
                <Show when={(props.showCurrTime ?? true) && state().showCurrTime}>
                    <For each={currPos()}>
                        {(pos) => (
                            <>
                                <div class={`${prefixCls}-curr-circle`} style={{ top: currTop(pos) }} />
                                <div class={`${prefixCls}-curr-line`} style={{ top: currTop(pos) }} />
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
                                class={`${cssClasses.PREFIX}-event-item ${cssClasses.PREFIX}-event-day`}
                                style={{
                                    top: `${event().startPos * props.scrollHeight}px`,
                                    height: `${Math.max(minEventHeight(), (event().endPos - event().startPos) * props.scrollHeight)}px`,
                                    left: toCssLength(event().left),
                                }}
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
