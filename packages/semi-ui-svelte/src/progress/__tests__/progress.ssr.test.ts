import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { Progress } from '../index';

describe('Progress 服务端渲染', () => {
    it('首帧输出目标值、文字与填充宽度', () => {
        const { body } = render(Progress, { props: { percent: 40, showInfo: true } });
        expect(body).toContain('aria-valuenow="40"');
        expect(body).toContain('width: 40%');
        expect(body).toContain('40%');
    });

    it('环形输出 svg 与文字', () => {
        const { body } = render(Progress, { props: { type: 'circle', percent: 25, showInfo: true } });
        expect(body).toContain('semi-progress-circle-ring');
        expect(body).toContain('25%');
    });
});
