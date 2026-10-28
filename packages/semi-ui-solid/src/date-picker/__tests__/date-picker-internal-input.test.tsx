import { render } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import DatePicker from '..';
import semiGlobal from '../../_utils/semi-global';

const GLOBAL_INPUT = { showClear: true, prefix: 'mark-prefix', suffix: 'mark-suffix', insetLabel: 'mark-label', addonBefore: 'mark-before', addonAfter: 'mark-after' };
const clearButtonIn = (root: ParentNode) => root.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`);

describe('全局 Input 默认值不给 DatePicker 内部输入框加清除按钮与前后缀', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('单框不读取全局 Input 默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Input: GLOBAL_INPUT };
        const { container } = render(() => <DatePicker defaultValue={new Date(2024, 0, 15)} />);
        expect(container.textContent).not.toMatch(/mark-/);
    });

    it('单框前缀仍读取 DatePicker 自己的全局默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Input: GLOBAL_INPUT, DatePicker: { prefix: 'mark-prefix-host' } };
        const { container } = render(() => <DatePicker defaultValue={new Date(2024, 0, 15)} />);
        expect(container.textContent).toContain('mark-prefix-host');
        expect(container.textContent).not.toMatch(/mark-(suffix|label|before|after)/);
    });

    it('范围输入框', () => {
        semiGlobal.config.overrideDefaultProps = { Input: GLOBAL_INPUT };
        const { container } = render(() => <DatePicker type="dateRange" defaultValue={[new Date(2024, 0, 15), new Date(2024, 0, 20)]} />);
        expect(container.textContent).not.toMatch(/mark-/);
        expect(clearButtonIn(container)).toBeNull();
    });

    it('面板内 insetInput', () => {
        semiGlobal.config.overrideDefaultProps = { Input: GLOBAL_INPUT };
        render(() => <DatePicker type="dateTime" defaultValue={new Date(2024, 0, 15)} defaultOpen insetInput motion={false} />);
        const insetInputs = document.querySelector(`.${BASE_CLASS_PREFIX}-datepicker-inset-input-wrapper`) as HTMLElement;
        expect(insetInputs.querySelectorAll('input').length).toBeGreaterThan(0);
        expect(insetInputs.textContent).not.toMatch(/mark-/);
        expect(clearButtonIn(insetInputs)).toBeNull();
    });
});
