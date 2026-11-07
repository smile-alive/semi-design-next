import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { Pagination } from '..';

describe('Svelte Pagination 服务端首帧', () => {
    it('首帧带页码、当前页标记、截断省略号与上一页下一页名称', () => {
        const { body } = render(Pagination, { props: { currentPage: 10, showTotal: true, total: 200 } });
        expect(body).toMatch(/<ul[^>]*class="[^"]*semi-page/);
        expect(body).toContain('semi-page-total');
        expect(body).toMatch(/<button[^>]*aria-current="page"[^>]*>(<!--[^>]*-->)*\s*10/);
        expect(body).toContain('aria-label="更多"');
        expect(body).toContain('aria-label="上一页"');
        expect(body).toContain('aria-label="下一页"');
    });

    it('small 尺寸首帧显示当前页/总页数，根属性落到 ul', () => {
        const { body } = render(Pagination, { props: { size: 'small', total: 90, 'aria-label': 'Pages', id: 'pager' } });
        expect(body).toContain('semi-page-small');
        expect(body).toMatch(/semi-page-item-small[^>]*>(<!--[^>]*-->)*\s*1\/9/);
        expect(body).toMatch(/<ul[^>]*aria-label="Pages"/);
        expect(body).toMatch(/<ul[^>]*id="pager"/);
    });

    it('hideOnSinglePage 单页时不输出', () => {
        const { body } = render(Pagination, { props: { hideOnSinglePage: true, total: 5 } });
        expect(body).not.toContain('semi-page');
    });
});
