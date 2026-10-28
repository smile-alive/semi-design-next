import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import Descriptions, { type Data } from '..';

const data: Data[] = [
    { key: 'Users', value: '1,480,000' },
    { key: 'Level', value: 'Gold', hidden: true },
    { key: 'Status', value: 'Verified' },
];

it.each(['vertical', 'horizontal'] as const)('descriptions/%s 布局下隐藏项的内容不在服务端创建', async (layout) => {
    const created: string[] = [];
    const counted = (text: string | number | undefined) => {
        created.push(String(text));
        return <b>{text}</b>;
    };
    const { html, errors } = await renderServer({
        render: () => <Descriptions layout={layout} data={data} renderKey={(item) => counted(item.key)} renderValue={(item, index) => counted(`${index}:${item.value}`)} />,
    });
    expect(errors).toEqual([]);
    expect(created).toEqual(['Users', '0:1,480,000', 'Status', '2:Verified']);
    expect(html).toMatch(/<b[^>]*>Users<\/b>/);
    expect(html).not.toContain('Gold');
});

it('descriptions/data 的 key 与 value 不接受 JSX', () => {
    // @ts-expect-error nodes go through renderKey and renderValue
    const jsxData: Data[] = [{ key: <b>Level</b>, value: <b>Gold</b> }];
    expect(jsxData).toHaveLength(1);
});
