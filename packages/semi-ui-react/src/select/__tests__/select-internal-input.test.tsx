import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Select from '..';
import semiGlobal from '../../_utils/semi-global';

const MARKER = /mark-(prefix|suffix|label|before|after)/;
const optionList = [{ value: 'a', label: 'A' }];

describe('全局 Input 默认值不给 Select 内部输入框加清除按钮与前后缀', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('触发器搜索框', async () => {
        semiGlobal.config.overrideDefaultProps = {
            Input: { showClear: true, prefix: 'mark-prefix', suffix: 'mark-suffix', insetLabel: 'mark-label', addonBefore: 'mark-before', addonAfter: 'mark-after' },
        };
        const { container } = render(<Select defaultValue={['a']} multiple filter optionList={optionList} />);
        await userEvent.type(container.querySelector('input'), 'a');
        expect(container.querySelector('input')).toHaveValue('a');
        expect(document.body.textContent).not.toMatch(MARKER);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
    });

    it('下拉搜索框', async () => {
        semiGlobal.config.overrideDefaultProps = {
            Input: { suffix: 'mark-suffix', insetLabel: 'mark-label', addonBefore: 'mark-before', addonAfter: 'mark-after' },
        };
        render(<Select defaultOpen filter optionList={optionList} searchPosition="dropdown" />);
        await userEvent.type(screen.getByRole('textbox'), 'a');
        expect(document.body.textContent).not.toMatch(MARKER);
    });
});
