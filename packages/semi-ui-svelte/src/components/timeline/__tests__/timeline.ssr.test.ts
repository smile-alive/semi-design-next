import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { Timeline } from '../index';

describe('Timeline 服务端渲染', () => {
    it('首帧输出全部项目、位置类名与内容', () => {
        const { body } = render(Timeline, {
            props: { mode: 'alternate', dataSource: [{ content: '甲', time: 't1' }, { content: '乙' }] },
        });
        expect(body).toContain('semi-timeline-alternate');
        expect(body).toContain('semi-timeline-item-left');
        expect(body).toContain('semi-timeline-item-right');
        expect(body).toContain('甲');
        expect(body).toContain('t1');
    });
});
