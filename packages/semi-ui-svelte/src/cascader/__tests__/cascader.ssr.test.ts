import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import type { CascaderData, CascaderProps, CascaderValue } from '..';
import { createStore } from '../../_base/__tests__/store.svelte';
import CascaderCase from './cascader-case.svelte';

const treeData: CascaderData[] = [
    { label: '亚洲', value: 'Asia', children: [{ label: '中国', value: 'China', children: [{ label: '北京', value: 'Beijing' }] }] },
    {
        label: '北美洲',
        value: 'North America',
        children: [
            { label: '美国', value: 'United States' },
            { label: '加拿大', value: 'Canada' },
        ],
    },
];

function renderCascader(props: Omit<CascaderProps, 'value' | 'treeData'>, value?: CascaderValue) {
    const store = createStore<{ value?: CascaderValue; accept: boolean; log: string[]; treeData: CascaderData[] }>({ value, accept: true, log: [], treeData });
    return render(CascaderCase, { props: { mode: 'one-way', store, props } }).body;
}

describe('Svelte Cascader 服务端首帧', () => {
    it('单选首帧带选中路径文本、combobox 角色与语言包名称', () => {
        const body = renderCascader({ showClear: true, 'data-x': '1' } as CascaderProps, ['North America', 'Canada']);
        expect(body).toContain('北美洲 / 加拿大');
        expect(body).toMatch(/<div[^>]*role="combobox"/);
        expect(body).toMatch(/<div[^>]*data-x="1"/);
        expect(body).toContain('aria-haspopup="tree"');
        expect(body).not.toContain('semi-cascader-popover');
    });

    it('多选首帧带标签与折叠的 +N', () => {
        const body = renderCascader({ multiple: true, maxTagCount: 1, autoMergeValue: false }, [
            ['North America', 'United States'],
            ['North America', 'Canada'],
        ]);
        expect(body).toContain('semi-tag');
        expect(body).toContain('美国');
        expect(body).toContain('>+2<');
        expect(body).not.toContain('>加拿大<');
    });
});
