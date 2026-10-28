import { render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import TreeSelect from '..';
import semiGlobal from '../../_utils/semi-global';

const treeData = [{ label: 'Asia', value: 'asia', key: 'asia' }];

describe('全局 Input 默认值不给 TreeSelect 搜索框加清除按钮与前后缀', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('下拉与触发器搜索框', async () => {
        semiGlobal.config.overrideDefaultProps = {
            Input: { showClear: true, prefix: 'mark-prefix', suffix: 'mark-suffix', insetLabel: 'mark-label', addonBefore: 'mark-before', addonAfter: 'mark-after' },
        };
        const { unmount } = render(() => <TreeSelect defaultOpen filterTreeNode treeData={treeData} />);
        await userEvent.type(screen.getByRole('textbox'), 'a');
        expect(document.body.textContent).not.toMatch(/mark-/);
        unmount();

        const { container } = render(() => <TreeSelect filterTreeNode searchPosition="trigger" treeData={treeData} />);
        await userEvent.type(container.querySelector('input') as HTMLInputElement, 'a');
        expect(document.body.textContent).not.toMatch(/mark-/);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
    });
});
