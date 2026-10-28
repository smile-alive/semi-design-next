import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import Cascader from '..';
import semiGlobal from '../../_utils/semi-global';

describe('全局 Input 默认值不给 Cascader 触发器搜索框加清除按钮', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('触发器搜索框', async () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true } };
        const { container } = render(Cascader, {
            props: { filterTreeNode: true, treeData: [{ label: 'Asia', value: 'asia', children: [{ label: 'China', value: 'china' }] }] },
        });
        await userEvent.click(container.querySelector(`.${BASE_CLASS_PREFIX}-cascader`) as HTMLElement);
        await userEvent.paste('a');
        await new Promise((resolve) => setTimeout(resolve));
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
    });
});
