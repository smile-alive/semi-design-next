import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import FeedbackFixture from './feedback-fixture.svelte';

describe('Svelte Feedback 服务端首帧', () => {
    it.each(['popup', 'modal'] as const)('%s：默认打开的对话框在服务端不输出，Portal 挂载后才渲染', (mode) => {
        const store = createStore({ props: { mode, visible: true, title: 'Feedback' } });
        const { body } = render(FeedbackFixture, { props: { store } });
        expect(body).not.toContain('semi-feedback');
        expect(body).not.toContain('semi-portal');
    });
});
