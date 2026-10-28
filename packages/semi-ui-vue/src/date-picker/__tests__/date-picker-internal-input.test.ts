import { afterEach, describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import DatePicker from '..';
import semiGlobal from '../../_utils/semi-global';

const clearButtonIn = (root: ParentNode) => root.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`);
const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('全局 Input 默认值不给 DatePicker 内部输入框加清除按钮', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('范围输入框', async () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true } };
        const { container } = render(DatePicker, { props: { type: 'dateRange', defaultValue: [new Date(2024, 0, 15), new Date(2024, 0, 20)] } });
        await settle();
        expect(clearButtonIn(container)).toBeNull();
    });

    it('面板内 insetInput', async () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true } };
        render(DatePicker, { props: { type: 'dateTime', insetInput: true, defaultOpen: true, motion: false, defaultValue: new Date(2024, 0, 15) } });
        await settle();
        const insetInputs = document.querySelector(`.${BASE_CLASS_PREFIX}-datepicker-inset-input-wrapper`) as HTMLElement;
        expect(insetInputs.querySelectorAll('input').length).toBeGreaterThan(0);
        expect(clearButtonIn(insetInputs)).toBeNull();
    });
});
