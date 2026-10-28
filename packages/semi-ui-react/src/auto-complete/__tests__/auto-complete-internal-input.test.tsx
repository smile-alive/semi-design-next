import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import AutoComplete from '..';
import semiGlobal from '../../_utils/semi-global';

const GLOBAL_INPUT = { showClear: true, prefix: 'mark-prefix', suffix: 'mark-suffix', insetLabel: 'mark-label', addonBefore: 'mark-before', addonAfter: 'mark-after' };

describe('全局 Input 默认值不给 AutoComplete 输入框加清除按钮与前后缀', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('不读取全局 Input 默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Input: GLOBAL_INPUT };
        const { container } = render(<AutoComplete defaultValue="a" data={['a']} />);
        expect(container.textContent).not.toMatch(/mark-/);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
    });

    it('前后缀仍读取 AutoComplete 自己的全局默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Input: GLOBAL_INPUT, AutoComplete: { prefix: 'mark-prefix-host', suffix: 'mark-suffix-host' } };
        const { container } = render(<AutoComplete defaultValue="a" data={['a']} />);
        expect(container.textContent).toContain('mark-prefix-host');
        expect(container.textContent).toContain('mark-suffix-host');
        expect(container.textContent).not.toMatch(/mark-(label|before|after)/);
    });
});
