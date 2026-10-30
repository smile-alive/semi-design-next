import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import Descriptions from '../descriptions.svelte';

describe('Svelte Descriptions 服务端渲染', () => {
    it('首帧输出表格行', () => {
        const { body } = render(Descriptions, { props: { data: [{ key: 'Users', value: '1,480,000' }] } });
        expect(body).toContain('semi-descriptions');
        expect(body).toContain('Users');
        expect(body).toContain('1,480,000');
    });
});
