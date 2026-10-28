import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import Transfer from '..';
import semiGlobal from '../../_utils/semi-global';

describe('全局 Input 默认值不给 Transfer 搜索框加后缀与标签', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('搜索框', async () => {
        semiGlobal.config.overrideDefaultProps = {
            Input: { suffix: 'mark-suffix', insetLabel: 'mark-label', addonBefore: 'mark-before', addonAfter: 'mark-after' },
        };
        const { container } = render(<Transfer dataSource={[{ key: '1', label: 'one', value: '1' }]} />);
        await userEvent.type(container.querySelector('input'), 'a');
        expect(container.textContent).not.toMatch(/mark-/);
    });
});
