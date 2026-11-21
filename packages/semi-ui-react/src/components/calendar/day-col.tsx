import { Fragment } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/calendar/constants';
import CalendarFoundation, { type CalendarAdapter, type CalendarBaseState } from '@fibrae/semi-foundation/components/calendar/foundation';
import '@fibrae/semi-foundation/components/calendar/calendar.scss';
import { useFoundation } from '../../base/index';
import type { DayColProps } from './interface';

type Foundation = CalendarFoundation<DayColProps>;
type Adapter = CalendarAdapter<DayColProps>;

const prefixCls = `${cssClasses.PREFIX}-grid`;
const hours = Array.from({ length: 25 }, (_, hour) => hour);

function pad(d: number) {
    return d < 10 ? `0${d.toString()}` : d.toString();
}

export default function DayCol(props: DayColProps) {
    const { events, scrollHeight, minEventHeight = Number.MIN_SAFE_INTEGER, displayValue, isWeekend, dateGridRender, handleClick, showCurrTime = true, classNames, styles } = props;

    const [, state] = useFoundation<Foundation, Adapter, DayColProps, CalendarBaseState>(
        CalendarFoundation,
        props,
        () => CalendarFoundation.getInitialState(),
        () => ({})
    );

    const { currPos } = state;
    const currTop = currPos * scrollHeight;

    const skCls = clsx(`${prefixCls}-skeleton`, {
        [`${cssClasses.PREFIX}-weekend`]: isWeekend,
    });

    return (
        <div className={clsx(prefixCls, classNames?.day)} style={styles?.day} role="cell">
            <div className={`${prefixCls}-content`}>
                {showCurrTime && state.showCurrTime && (
                    <Fragment key={currPos}>
                        <div className={clsx(`${prefixCls}-curr-circle`, classNames?.currentTimeDot)} style={{ top: currTop, ...styles?.currentTimeDot }} />
                        <div className={clsx(`${prefixCls}-curr-line`, classNames?.currentTimeLine)} style={{ top: currTop, ...styles?.currentTimeLine }} />
                    </Fragment>
                )}
                <div className={skCls}>
                    {hours.map((hour) => (
                        <Fragment key={`${hour}-daycol`}>
                            {/* pointer-only time slots: the cell has no keyboard way to pick a time, as before */}
                            <div className={`${prefixCls}-skeleton-row-line`} data-time={`${pad(hour)}:00:00`} onClick={(e) => handleClick(e, [displayValue, hour, 0, 0])} />
                            <div data-time={`${pad(hour)}:30:00`} onClick={(e) => handleClick(e, [displayValue, hour, 30, 0])} />
                        </Fragment>
                    ))}
                </div>
                {dateGridRender && dateGridRender(displayValue.toString(), displayValue)}
                <ul className={`${cssClasses.PREFIX}-event-items`}>
                    {events.map(({ startPos, endPos, children, key, left }) => {
                        const top = startPos * scrollHeight;
                        const height = (endPos - startPos) * scrollHeight;
                        return (
                            <li key={key} className={clsx(`${cssClasses.PREFIX}-event-item ${cssClasses.PREFIX}-event-day`, classNames?.event)} style={{ top: `${top}px`, height: `${Math.max(minEventHeight, height)}px`, insetInlineStart: left, ...styles?.event }}>
                                {children}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
