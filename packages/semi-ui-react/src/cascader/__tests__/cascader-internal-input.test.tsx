import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Cascader from '..';
import semiGlobal from '../../_utils/semi-global';

describe('全局 Input 默认值不给 Cascader 触发器搜索框加清除按钮与前后缀', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('触发器搜索框', async () => {
        semiGlobal.config.overrideDefaultProps = {
            Input: { showClear: true, prefix: 'mark-prefix', suffix: 'mark-suffix', insetLabel: 'mark-label', addonBefore: 'mark-before', addonAfter: 'mark-after' },
        };
        const { container } = render(<Cascader filterTreeNode treeData={[{ label: 'Asia', value: 'asia', children: [{ label: 'China', value: 'china' }] }]} />);
        await userEvent.click(container.querySelector(`.${BASE_CLASS_PREFIX}-cascader`));
        await userEvent.paste('a');
        expect(document.body.textContent).not.toMatch(/mark-/);
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
    });
});
