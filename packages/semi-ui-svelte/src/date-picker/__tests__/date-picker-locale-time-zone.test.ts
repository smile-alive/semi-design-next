import { render } from '@testing-library/svelte';
import { add, format, parse, set } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import { describe, expect, it } from 'vite-plus/test';
import { strings } from '@fibrae/semi-foundation/date-picker/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { toIANA, zonedTimeToUtc } from '@fibrae/semi-foundation/utils/date-fns-extra';
import { createStore } from '../../_base/__tests__/store.svelte';
import { click, ymd } from './date-picker-dom-utils';
import ProviderFixture, { type ProviderFixtureStore } from './date-picker-provider-fixture.svelte';
import { dp, getInput, settle, useBaseDate } from './test-utils';

useBaseDate();

async function renderProvided(init: Omit<ProviderFixtureStore, 'props'> & { props?: ProviderFixtureStore['props'] }) {
    const store = createStore<ProviderFixtureStore>({ ...init, props: { motion: false, ...init.props } });
    render(ProviderFixture, { props: { store } });
    await settle();
    return store;
}

describe('Svelte DatePicker locale 格式', () => {
    const localeFormat = 'yyyy-MM-dd EEEE';
    const value = new Date('2021-04-30');

    it('默认语言包按中文格式化星期', async () => {
        await renderProvided({ props: { value, format: localeFormat } });
        expect(getInput()).toHaveValue(format(value, localeFormat, { locale: zhCN }));
    });

    it('LocaleProvider 提供 en_US 时按英文格式化星期', async () => {
        await renderProvided({ locale: en_US, props: { value, format: localeFormat } });
        expect(getInput()).toHaveValue(format(value, localeFormat, { locale: enUS }));
    });
});

// Zone offsets are indexes into -11..+14, the same range the zone picker of the Vue suite draws from
describe('Svelte DatePicker timeZone', () => {
    const zones = [
        [5, 20],
        [20, 3],
    ] as const;
    const zoneOf = (index: number) => toIANA(index - 11);

    it.each(zones)('切换 ConfigProvider 的 timeZone 时，已选日期的输入框跟随换算（%i -> %i）', async (originIndex, newIndex) => {
        const today = set(new Date(), { hours: 22, minutes: 0, seconds: 0 });
        const store = await renderProvided({ timeZone: zoneOf(originIndex), props: { type: 'dateTime', open: true, defaultPickerValue: today } });

        const days = document.querySelectorAll<HTMLElement>(`.${dp}-day`);
        // index 6 is always a valid date: the first row holds 7 cells, at most one of which belongs to the previous month
        await click(days[6]);
        expect(document.querySelectorAll(`.${dp}-day-selected`)).toHaveLength(1);
        const input = getInput();
        const selected = parse(input.value, strings.FORMAT_DATE_TIME, new Date());
        expect(ymd(selected)).toBe(days[6].getAttribute('aria-label'));
        expect(format(selected, 'HH:mm:ss')).toBe('22:00:00');

        store.timeZone = zoneOf(newIndex);
        await settle();
        expect(input.value).toEqual(format(add(selected, { hours: newIndex - originIndex }), strings.FORMAT_DATE_TIME));
    });

    it.each(zones)('value 传入时切换 timeZone，输入框按新时区重新格式化（%i -> %i）', async (originIndex, newIndex) => {
        const now = new Date();
        const value = zonedTimeToUtc(now, zoneOf(originIndex));
        const store = await renderProvided({ timeZone: zoneOf(originIndex), props: { type: 'dateTime', value, open: true } });

        const input = getInput();
        expect(input.value).toEqual(format(now, strings.FORMAT_DATE_TIME));
        store.timeZone = zoneOf(newIndex);
        await settle();
        expect(input.value).toEqual(format(add(now, { hours: newIndex - originIndex }), strings.FORMAT_DATE_TIME));
    });
});
