import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import TimePicker from '..';
import semiGlobal from '../../_utils/semi-global';

const GLOBAL_INPUT = { prefix: 'mark-prefix', insetLabel: 'mark-label', addonBefore: 'mark-before', addonAfter: 'mark-after' };

describe('全局 Input 默认值不给 TimePicker 输入框加前缀与标签', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('不读取全局 Input 默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Input: GLOBAL_INPUT };
        const { container } = render(<TimePicker defaultValue="10:00:00" />);
        expect(container.textContent).not.toMatch(/mark-/);
    });

    it('前缀仍读取 TimePicker 自己的全局默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Input: GLOBAL_INPUT, TimePicker: { prefix: 'mark-prefix-host' } };
        const { container } = render(<TimePicker defaultValue="10:00:00" />);
        expect(container.textContent).toContain('mark-prefix-host');
        expect(container.textContent).not.toMatch(/mark-(label|before|after)/);
    });
});
