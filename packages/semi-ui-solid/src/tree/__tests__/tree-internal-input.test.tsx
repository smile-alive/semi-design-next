import { render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import Tree from '..';
import semiGlobal from '../../_utils/semi-global';

describe('全局 Input 默认值不给 Tree 搜索框加后缀与标签', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('搜索框', async () => {
        semiGlobal.config.overrideDefaultProps = {
            Input: { suffix: 'mark-suffix', insetLabel: 'mark-label', addonBefore: 'mark-before', addonAfter: 'mark-after' },
        };
        const { container } = render(() => <Tree filterTreeNode treeData={[{ label: 'Asia', value: 'asia', key: 'asia' }]} />);
        await userEvent.type(screen.getByRole('textbox'), 'a');
        expect(container.textContent).not.toMatch(/mark-/);
    });
});
