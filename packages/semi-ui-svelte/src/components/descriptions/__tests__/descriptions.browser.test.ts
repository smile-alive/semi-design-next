import { render } from '@testing-library/svelte';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Descriptions from '../descriptions.svelte';

const data = [
    { key: 'Users', value: '1,480,000' },
    { key: 'Retention', value: '98%' },
];

describe('Svelte Descriptions（浏览器）', () => {
    it('显式声明 border-collapse，不依赖宿主或 UA 默认值', () => {
        // a host that restores the UA default, in a layer below Semi's like the docs site's reset
        const reset = document.createElement('style');
        reset.textContent = '@layer semi.reset { table { border-collapse: separate; border-spacing: 2px; } }';
        document.head.append(reset);
        onTestFinished(() => reset.remove());

        const { container } = render(Descriptions, { props: { data } });
        expect(getComputedStyle(container.querySelector('table') as Element).borderCollapse).toBe('collapse');
    });

    it('align="left" 在 RTL 下镜像', () => {
        const { container } = render(Descriptions, { props: { align: 'left', data, dir: 'rtl' } });
        for (const cell of container.querySelectorAll(`.${BASE_CLASS_PREFIX}-descriptions-item-th, .${BASE_CLASS_PREFIX}-descriptions-item-td`)) {
            const style = getComputedStyle(cell);
            expect([style.direction, style.textAlign]).toEqual(['rtl', 'start']);
        }
    });
});
