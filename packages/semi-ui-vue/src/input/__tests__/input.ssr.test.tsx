/** @jsxImportSource vue */
import { expect, it } from 'vite-plus/test';
import { renderOnServer } from '@test/utils/vue.ssr';
import Input from '..';

it('受控值在服务端 HTML 中已写入 value', async () => {
    const { html, warnings } = await renderOnServer(() => <Input modelValue="controlled" />);
    expect(warnings).toEqual([]);
    expect(html).toContain('value="controlled"');
});
