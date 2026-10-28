import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/calendar/constants';
import '@fibrae/semi-foundation/calendar/calendar.scss';
import useLocale from '../locale/use-locale';
import type { TimeColProps } from './interface';

const prefixCls = `${cssClasses.PREFIX}-time`;
const hours = Array.from({ length: 24 }, (_, hour) => hour);

export default function TimeCol({ className, renderTimeDisplay }: TimeColProps) {
    const { locale } = useLocale('Calendar');

    const formatTime = (hour: number) => {
        if (typeof renderTimeDisplay === 'function') {
            return renderTimeDisplay(hour);
        }
        return hour < 12 ? locale.AM.replace('${time}', String(hour)) : locale.PM.replace('${time}', String(hour === 12 ? hour : hour - 12));
    };

    return (
        <div className={clsx(className, prefixCls)} role="cell">
            <div className={`${prefixCls}-items`}>
                {hours.map((hour) => (
                    <div key={`time-${hour}`} className={`${prefixCls}-item`}>
                        {/* the grid starts at 00:00, which has no label */}
                        <span>{hour === 0 ? '' : formatTime(hour)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
