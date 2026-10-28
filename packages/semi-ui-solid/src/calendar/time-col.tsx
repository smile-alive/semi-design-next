import { For } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/calendar/constants';
import '@fibrae/semi-foundation/calendar/calendar.scss';
import useLocale from '../locale/use-locale';
import type { TimeColProps } from './interface';

const prefixCls = `${cssClasses.PREFIX}-time`;
const hours = Array.from({ length: 24 }, (_, hour) => hour);

export default function TimeCol(props: TimeColProps) {
    const locale = useLocale('Calendar');

    const formatTime = (hour: number) => {
        if (typeof props.renderTimeDisplay === 'function') {
            return props.renderTimeDisplay(hour);
        }
        const { AM, PM } = locale().locale;
        return hour < 12 ? AM.replace('${time}', String(hour)) : PM.replace('${time}', String(hour === 12 ? hour : hour - 12));
    };

    return (
        <div class={clsx(props.class, prefixCls)} role="cell">
            <div class={`${prefixCls}-items`}>
                <For each={hours}>
                    {(hour) => (
                        <div class={`${prefixCls}-item`}>
                            {/* the grid starts at 00:00, which has no label */}
                            <span>{hour === 0 ? '' : formatTime(hour)}</span>
                        </div>
                    )}
                </For>
            </div>
        </div>
    );
}
