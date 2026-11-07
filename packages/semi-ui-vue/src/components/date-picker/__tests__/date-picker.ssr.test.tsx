/** @jsxImportSource vue */
import { expect, it } from 'vite-plus/test';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { renderOnServer } from '@test/utils/vue.ssr';
import DatePicker from '..';
import Month from '../month.vue';

it('受控值与 defaultValue 在服务端 HTML 中已显示在输入框', async () => {
    const controlled = await renderOnServer(() => <DatePicker modelValue={new Date(2024, 4, 6)} />);
    expect(controlled.warnings).toEqual([]);
    expect(controlled.html).toContain('2024-05-06');

    const uncontrolled = await renderOnServer(() => <DatePicker defaultValue={new Date(2024, 4, 7)} />);
    expect(uncontrolled.html).toContain('2024-05-07');
});

it('日期范围受控值在服务端 HTML 中两端都已显示', async () => {
    const { html, warnings } = await renderOnServer(() => <DatePicker modelValue={[new Date(2024, 4, 6), new Date(2024, 4, 20)]} type="dateRange" />);
    expect(warnings).toEqual([]);
    expect(html).toContain('2024-05-06');
    expect(html).toContain('2024-05-20');
});

it('日期面板在服务端不标记今天', async () => {
    const { html, warnings } = await renderOnServer(() => (
        <Month disabledDate={() => false} focusRecords={{ rangeStart: false, rangeEnd: false }} hoverDay="" locale={en_US.DatePicker} month={new Date()} multiple={false} offsetRangeEnd="" offsetRangeStart="" rangeEnd="" rangeInputFocus={false} rangeStart="" selected={new Set()} weekStartsOn={0} />
    ));
    expect(warnings).toEqual([]);
    expect(html).toContain('semi-datepicker-day');
    expect(html).not.toMatch(/semi-datepicker-day-today(?![-\w])/);
});
