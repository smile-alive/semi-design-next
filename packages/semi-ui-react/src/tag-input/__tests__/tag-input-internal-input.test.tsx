import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import TagInput from '..';
import semiGlobal from '../../_utils/semi-global';

describe('全局 Input 默认值不给 TagInput 内部输入框加清除按钮与前后缀', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('内部输入框', () => {
        semiGlobal.config.overrideDefaultProps = {
            Input: { showClear: true, prefix: 'mark-prefix', suffix: 'mark-suffix', insetLabel: 'mark-label', addonBefore: 'mark-before', addonAfter: 'mark-after' },
        };
        const { container } = render(<TagInput defaultValue={['a']} inputValue="b" />);
        expect(container.textContent).not.toMatch(/mark-/);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
    });
});
