import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { Steps } from '../index';

describe('Steps 服务端渲染', () => {
    it('首帧输出全部步骤、状态类名、序号与等宽列', () => {
        const { body } = render(Steps, {
            props: { type: 'fill', current: 1, dataSource: [{ title: '甲', description: '一' }, { title: '乙' }, { title: '丙' }] },
        });
        expect(body).toContain('semi-steps-item-finish');
        expect(body).toContain('semi-steps-item-process');
        expect(body).toContain('semi-steps-item-wait');
        expect(body).toContain('甲');
        expect(body).toContain('丙');
        expect(body).toContain('aria-current="step"');
        expect(body).toContain('width: 33.333333333333336%');
    });

    it('有 onChange 时首帧步骤就是 button', () => {
        const { body } = render(Steps, { props: { type: 'basic', onChange: () => {}, dataSource: [{ title: 'a' }] } });
        expect(body).toContain('role="button"');
        expect(body).toContain('tabindex="0"');
    });
});
