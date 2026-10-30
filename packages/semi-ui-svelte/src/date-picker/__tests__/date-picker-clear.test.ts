import { fireEvent } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { changes, dp, getInput, getInputs, getRoot, setup, settle, useBaseDate } from './test-utils';

useBaseDate();

async function clearSingle() {
    await fireEvent.mouseDown(getRoot().querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`) as HTMLElement, { button: 0 });
    await settle();
}

async function clearRange() {
    await fireEvent.mouseDown(document.querySelector(`.${dp}-range-input-clearbtn`) as HTMLElement, { button: 0 });
    await settle();
}

const single = new Date(2019, 7, 10, 8, 0, 0);
const range = [new Date(2019, 7, 5, 8, 0, 0), new Date(2019, 7, 9, 8, 0, 0)];

describe('Svelte DatePicker needConfirm 下的清除', () => {
    it('bind:value：清除立即写回 undefined，输入框清空，onChange 与 onClear 各一次', async () => {
        const { store } = await setup({ mode: 'bind', value: single, props: { type: 'dateTime', needConfirm: true } });
        await clearSingle();
        expect(store.value).toBeUndefined();
        expect(getInput()).toHaveValue('');
        expect(changes(store)).toEqual(['change undefined undefined']);
        expect(store.log.filter((entry) => entry === 'clear')).toHaveLength(1);
    });

    it('函数绑定：setter 收到 undefined，接受后输入框清空', async () => {
        const { store } = await setup({ mode: 'function', value: single, props: { type: 'dateTime', needConfirm: true } });
        await clearSingle();
        expect(store.log).toContain('set undefined');
        expect(store.value).toBeUndefined();
        expect(getInput()).toHaveValue('');
    });

    it('函数绑定：setter 拒绝时输入框保持原值', async () => {
        const { store } = await setup({ mode: 'function', value: single, accept: false, props: { type: 'dateTime', needConfirm: true } });
        await clearSingle();
        expect(store.log).toContain('set undefined');
        expect(store.value).toBe(single);
        expect(getInput()).toHaveValue('2019-08-10 08:00:00');
    });

    it('单向传值：清除在本地覆盖，输入框清空', async () => {
        const { store } = await setup({ value: single, props: { type: 'dateTime', needConfirm: true } });
        await clearSingle();
        expect(getInput()).toHaveValue('');
        expect(store.value).toBe(single);
    });

    it('bind:value 的范围类型：清除写回 []，两个输入框清空', async () => {
        const { store } = await setup({ mode: 'bind', value: range, props: { type: 'dateTimeRange', needConfirm: true } });
        await clearRange();
        expect(store.value).toEqual([]);
        expect(getInputs().map((input) => input.value)).toEqual(['', '']);
        expect(changes(store)).toEqual(['change  []']);
        expect(store.log.filter((entry) => entry === 'clear')).toHaveLength(1);
    });

    it('函数绑定的范围类型：setter 收到 []', async () => {
        const { store } = await setup({ mode: 'function', value: range, props: { type: 'dateTimeRange', needConfirm: true } });
        await clearRange();
        expect(store.log).toContain('set ');
        expect(store.value).toEqual([]);
        expect(getInputs().map((input) => input.value)).toEqual(['', '']);
    });

    it('清除后重新选择并确认，值写回新日期', async () => {
        const { store } = await setup({ mode: 'bind', value: single, open: true, props: { type: 'dateTime', needConfirm: true } });
        await clearSingle();
        expect(store.value).toBeUndefined();
        await fireEvent.click(document.querySelector(`.${dp}-day[aria-label="2019-08-12"]`) as HTMLElement);
        await settle();
        await fireEvent.click(document.querySelectorAll<HTMLElement>(`.${dp}-footer button`)[1]);
        await settle();
        expect(store.value).toBeInstanceOf(Date);
        expect((store.value as Date).getDate()).toBe(12);
    });
});
