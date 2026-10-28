/** @jsxImportSource vue */
import { defineComponent } from 'vue';
import { describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import Table from '..';
import ConfigProvider from '../../config-provider';
import { P, query } from './table-helpers';

const columns = [{ title: 'Name', dataIndex: 'name' }];
const dataSource = [{ key: '1', name: 'A' }];

describe('Table direction', () => {
    it('没有 ConfigProvider 与 direction 时根元素不输出 dir', () => {
        render(defineComponent(() => () => <Table columns={columns} dataSource={dataSource} pagination={false} />));
        expect(query(`.${P}-wrapper`).hasAttribute('dir')).toBe(false);
    });

    it('ConfigProvider direction="rtl" 时根元素 dir 为 rtl', () => {
        render(defineComponent(() => () => <ConfigProvider direction="rtl">{() => <Table columns={columns} dataSource={dataSource} pagination={false} />}</ConfigProvider>));
        expect(query(`.${P}-wrapper`).getAttribute('dir')).toBe('rtl');
    });

    it('direction 属性优先于 ConfigProvider', () => {
        render(defineComponent(() => () => <ConfigProvider direction="rtl">{() => <Table direction="ltr" columns={columns} dataSource={dataSource} pagination={false} />}</ConfigProvider>));
        expect(query(`.${P}-wrapper`).getAttribute('dir')).toBe('ltr');
    });
});
