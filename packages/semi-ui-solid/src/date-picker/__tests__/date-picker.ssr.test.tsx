import { expect, it } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { renderServer } from '@test/solid/ssr.solid';
import DatePicker from '..';
import Month from '../month';

it('日期面板在服务端不标记今天', async () => {
    const { html, errors } = await renderServer({
        render: () => (
            <Month
                disabledDate={() => false}
                focusRecords={{ rangeStart: false, rangeEnd: false }}
                hoverDay=""
                locale={en_US.DatePicker}
                month={new Date()}
                multiple={false}
                offsetRangeEnd=""
                offsetRangeStart=""
                onDayClick={() => {}}
                onDayHover={() => {}}
                onMonthSwitch={() => {}}
                onWeeksRowNumChange={() => {}}
                rangeEnd=""
                rangeInputFocus={false}
                rangeStart=""
                selected={new Set()}
                weekStartsOn={0}
            />
        ),
    });
    expect(errors).toEqual([]);
    expect(html).toContain('semi-datepicker-day');
    expect(html).not.toMatch(/semi-datepicker-day-today(?![-\w])/);
});

function counter(text: string) {
    const state = { created: 0 };
    const Counted = () => {
        state.created += 1;
        return text;
    };
    return { state, Counted };
}

it('范围输入没有可清除的值时不创建 clearIcon', async () => {
    const icon = counter('icon text');
    const { html, errors } = await renderServer({ render: () => <DatePicker type="dateRange" clearIcon={<icon.Counted />} /> });
    expect(errors).toEqual([]);
    expect(html).not.toContain('icon text');
    expect(icon.state.created).toBe(0);
});

it('范围输入同时传 prefix 与 insetLabel 时不创建 insetLabel', async () => {
    const prefix = counter('prefix text');
    const label = counter('label text');
    const { html, errors } = await renderServer({ render: () => <DatePicker type="dateRange" prefix={<prefix.Counted />} insetLabel={<label.Counted />} /> });
    expect(errors).toEqual([]);
    expect(html).toContain('prefix text');
    expect(html).not.toContain('label text');
    expect(prefix.state.created).toBe(1);
    expect(label.state.created).toBe(0);
});
