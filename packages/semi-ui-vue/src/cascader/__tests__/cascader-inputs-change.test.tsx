/** @jsxImportSource vue */
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import Cascader, { type CascaderData } from '..';

const prefixCls = `${BASE_CLASS_PREFIX}-cascader`;
const treeData: CascaderData[] = [
    {
        label: '亚洲',
        value: 'Asia',
        children: [
            { label: '北京', value: 'Beijing' },
            { label: '上海', value: 'Shanghai' },
        ],
    },
];
const grownTreeData: CascaderData[] = [{ ...treeData[0], children: [...(treeData[0].children ?? []), { label: '北海', value: 'Beihai' }] }];

const settle = () => new Promise((resolve) => setTimeout(resolve));
const getSearchInput = () => document.querySelector(`.${prefixCls}-selection input`) as HTMLInputElement;
const getResults = () => Array.from(document.querySelectorAll(`.${prefixCls}-option-flatten`)).map((row) => row.textContent);

describe('Cascader 的 treeData 变化', () => {
    it.each([false, true])('搜索中 treeData 更新时按当前关键字重算结果（multiple 为 %s）', async (multiple) => {
        const view = render(Cascader, { props: { motion: false, filterTreeNode: true, defaultOpen: true, multiple, treeData } });
        await settle();
        await userEvent.type(getSearchInput(), '北');
        await settle();
        expect(getResults()).toEqual(['亚洲 / 北京']);
        await view.rerender({ treeData: grownTreeData });
        await settle();
        expect(getResults()).toEqual(['亚洲 / 北京', '亚洲 / 北海']);
    });
});
