import { type JSX, createMemo, createSignal } from 'solid-js';
import { Calendar, type CalendarProps, DatePicker, type EventObject, Radio, RadioGroup } from '@fibrae/semi-ui-solid';

const dailyEventStyle: JSX.CSSProperties = {
    'border-radius': '3px',
    'box-sizing': 'border-box',
    border: 'var(--semi-color-primary) 1px solid',
    padding: '10px',
    'background-color': 'var(--semi-color-primary-light-default)',
    height: '100%',
    overflow: 'hidden',
};
const allDayStyle: JSX.CSSProperties = {
    'border-radius': '3px',
    'box-sizing': 'border-box',
    border: 'var(--semi-color-bg-1) 1px solid',
    padding: '2px 4px',
    'background-color': 'var(--semi-color-primary-light-active)',
    height: '100%',
    overflow: 'hidden',
};
const range = [new Date(2019, 6, 23), new Date(2019, 6, 26)];

export default function CalendarDemo() {
    const [mode, setMode] = createSignal<CalendarProps['mode']>('week');
    const [displayValue, setDisplayValue] = createSignal(new Date(2019, 6, 23, 8, 32, 0));

    // the daily events take their style from the mode, so the list is rebuilt whenever the mode changes
    const events = createMemo<EventObject[]>(() => {
        const dailyStyle = mode() === 'month' ? allDayStyle : dailyEventStyle;
        return [
            {
                key: '0',
                start: new Date(2019, 5, 25, 14, 45, 0),
                end: new Date(2019, 6, 26, 6, 18, 0),
                children: <div style={allDayStyle}>6月25日 14:45 ~ 7月26日 6:18</div>,
            },
            {
                key: '1',
                start: new Date(2019, 6, 18, 10, 0, 0),
                end: new Date(2019, 6, 30, 8, 0, 0),
                children: <div style={allDayStyle}>7月18日 10:00 ~ 7月30日 8:00</div>,
            },
            {
                key: '2',
                start: new Date(2019, 6, 19, 20, 0, 0),
                end: new Date(2019, 6, 23, 14, 0, 0),
                children: <div style={allDayStyle}>7月19日 20:00 ~ 7月23日 14:00</div>,
            },
            {
                key: '3',
                start: new Date(2019, 6, 21, 6, 0, 0),
                end: new Date(2019, 6, 25, 6, 0, 0),
                children: <div style={allDayStyle}>7月21日 6:00 ~ 7月25日 6:00</div>,
            },
            {
                key: '4',
                allDay: true,
                start: new Date(2019, 6, 22, 8, 0, 0),
                children: <div style={allDayStyle}>7月22日 全天</div>,
            },
            {
                key: '5',
                start: new Date(2019, 6, 22, 9, 0, 0),
                end: new Date(2019, 6, 23, 23, 0, 0),
                children: <div style={allDayStyle}>7月22日 9:00 ~ 7月23日 23:00</div>,
            },
            {
                key: '6',
                start: new Date(2019, 6, 23, 8, 32, 0),
                end: new Date(2019, 6, 23, 8, 42, 0),
                children: <div style={dailyStyle}>7月23日 8:32</div>,
            },
            {
                key: '7',
                start: new Date(2019, 6, 23, 14, 30, 0),
                end: new Date(2019, 6, 23, 20, 0, 0),
                children: <div style={dailyStyle}>7月23日 14:30-20:00</div>,
            },
            {
                key: '8',
                start: new Date(2019, 6, 25, 8, 0, 0),
                end: new Date(2019, 6, 27, 6, 0, 0),
                children: <div style={allDayStyle}>7月25日 8:00 ~ 7月27日 6:00</div>,
            },
            {
                key: '9',
                start: new Date(2019, 6, 26, 10, 0, 0),
                end: new Date(2019, 6, 27, 16, 0, 0),
                children: <div style={allDayStyle}>7月26日 10:00 ~ 7月27日 16:00</div>,
            },
        ];
    });

    return (
        <>
            <RadioGroup onChange={(e) => setMode(e.target.value)} value={mode()} type="button">
                <Radio value="day">日视图</Radio>
                <Radio value="week">周视图</Radio>
                <Radio value="month">月视图</Radio>
                <Radio value="range">多日视图</Radio>
            </RadioGroup>
            <br />
            <br />
            <DatePicker
                value={displayValue()}
                onChange={(value) => {
                    if (!Array.isArray(value)) setDisplayValue(value);
                }}
            />
            <br />
            <br />
            <Calendar height={400} mode={mode()} displayValue={displayValue()} events={events()} minEventHeight={40} range={mode() === 'range' ? range : []} />
        </>
    );
}
