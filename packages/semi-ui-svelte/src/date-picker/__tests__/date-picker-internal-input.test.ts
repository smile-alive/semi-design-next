import { afterEach, describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import semiGlobal from '../../_utils/semi-global';
import { dp, getRoot, setup } from './test-utils';

const clearButtonIn = (root: ParentNode) => root.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`);

describe('Svelte 全局 Input 默认值不给 DatePicker 内部输入框加清除按钮', () => {
    afterEach(() => {
        semiGlobal.config = {};
    });

    it('范围输入框', async () => {
        semiGlobal.config = { overrideDefaultProps: { Input: { showClear: true } } };
        await setup({ value: [new Date(2024, 0, 15), new Date(2024, 0, 20)], props: { type: 'dateRange' } });
        expect(clearButtonIn(getRoot())).toBeNull();
    });

    it('面板内 insetInput', async () => {
        semiGlobal.config = { overrideDefaultProps: { Input: { showClear: true } } };
        await setup({ value: new Date(2024, 0, 15), open: true, props: { type: 'dateTime', insetInput: true } });
        const insetInputs = document.querySelector(`.${dp}-inset-input-wrapper`) as HTMLElement;
        expect(insetInputs.querySelectorAll('input').length).toBeGreaterThan(0);
        expect(clearButtonIn(insetInputs)).toBeNull();
    });
});
