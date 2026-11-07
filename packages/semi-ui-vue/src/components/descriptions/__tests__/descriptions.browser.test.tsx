/** @jsxImportSource vue */
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import ConfigProvider from '../../config-provider';
import Descriptions from '../index';

const data = [
    { key: 'Users', value: '1,480,000' },
    { key: 'Retention', value: '98%' },
];

describe('Descriptions（浏览器）', () => {
    it('align="left" 对齐到起始侧，因此在 RTL 下镜像', () => {
        const { container } = render(() => <ConfigProvider direction="rtl">{() => <Descriptions align="left" data={data} />}</ConfigProvider>);
        for (const cell of container.querySelectorAll(`.${BASE_CLASS_PREFIX}-descriptions-item-th, .${BASE_CLASS_PREFIX}-descriptions-item-td`)) {
            const style = getComputedStyle(cell);
            expect([style.direction, style.textAlign]).toEqual(['rtl', 'start']);
        }
    });

    it('显式声明 border-collapse，不依赖宿主或 UA 默认值', () => {
        // a host that restores the UA default, in a layer below Semi's like the docs site's reset
        const reset = document.createElement('style');
        reset.textContent = '@layer semi.reset { table { border-collapse: separate; border-spacing: 2px; } }';
        document.head.append(reset);
        onTestFinished(() => reset.remove());

        const { container } = render(Descriptions, { props: { data } });
        expect(getComputedStyle(container.querySelector('table') as Element).borderCollapse).toBe('collapse');
    });

    it('row 模式不改写 value 里使用方自己的表格', () => {
        const { container } = render(Descriptions, {
            props: { data: [{ key: 'Nested' }], row: true },
            slots: {
                value: () => [
                    <table data-testid="own">
                        <tbody>
                            <tr>
                                <td>cell</td>
                            </tr>
                        </tbody>
                    </table>,
                ],
            },
        });
        const own = container.querySelector('[data-testid="own"]') as Element;
        expect(getComputedStyle(own.querySelector('tbody') as Element).display).toBe('table-row-group');
        expect(getComputedStyle(own.querySelector('tr') as Element).display).toBe('table-row');
        expect(getComputedStyle(own.querySelector('td') as Element).paddingTop).toBe('1px');
    });
});
