import { render } from '@solidjs/testing-library';
import { describe, expect, it, onTestFinished } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Descriptions from '..';
import ConfigProvider from '../../config-provider';

const prefixCls = `${BASE_CLASS_PREFIX}-descriptions`;

const data = [
    { key: 'Users', value: '1,480,000' },
    { key: 'Retention', value: '98%' },
];

describe('Descriptions（浏览器）', () => {
    it('align="left" 对齐到起始侧，因此在 RTL 下镜像', () => {
        const { container } = render(() => (
            <ConfigProvider direction="rtl">
                <Descriptions align="left" data={data} />
            </ConfigProvider>
        ));
        for (const cell of container.querySelectorAll(`.${prefixCls}-item-th, .${prefixCls}-item-td`)) {
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

        const { container } = render(() => <Descriptions data={data} />);
        expect(getComputedStyle(container.querySelector('table') as HTMLElement).borderCollapse).toBe('collapse');
    });

    it('row 模式不改写 value 里使用方自己的表格', () => {
        const { container } = render(() => (
            <Descriptions
                data={[{ key: 'Nested' }]}
                renderValue={() => (
                    <table data-testid="own">
                        <tbody>
                            <tr>
                                <td>cell</td>
                            </tr>
                        </tbody>
                    </table>
                )}
                row
            />
        ));
        const own = container.querySelector('[data-testid="own"]') as HTMLElement;
        expect(getComputedStyle(own.querySelector('tbody') as HTMLElement).display).toBe('table-row-group');
        expect(getComputedStyle(own.querySelector('tr') as HTMLElement).display).toBe('table-row');
        // the UA padding of a td survives
        expect(getComputedStyle(own.querySelector('td') as HTMLElement).paddingTop).toBe('1px');
    });
});
