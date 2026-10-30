import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import PopconfirmFixture from './popconfirm-fixture.svelte';

const store = { accept: true, log: [], shown: true, rtl: false, titleSnippet: false, content: 'text' as const, icon: 'default' as const, props: { title: 't' } };

describe('Svelte Popconfirm 服务端渲染', () => {
    it('首帧输出带 data-popupid 的触发按钮，不输出卡片', () => {
        const { body } = render(PopconfirmFixture, { props: { store } });
        expect(body).toMatch(/<button[^>]*data-popupid="semi-tooltip-[^"]+"/);
        expect(body).not.toContain('semi-popconfirm');
    });

    it('disabled 时只输出触发按钮，不带触发属性', () => {
        const { body } = render(PopconfirmFixture, { props: { store: { ...store, props: { ...store.props, disabled: true } } } });
        expect(body).toContain('>Save</button>');
        expect(body).not.toContain('data-popupid');
    });
});
