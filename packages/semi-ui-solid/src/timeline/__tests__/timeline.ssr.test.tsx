import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import Timeline, { type Data } from '..';

it('timeline/dataSource 的节点由渲染函数在服务端各创建一次', async () => {
    const created: string[] = [];
    const counted = (text: string) => {
        created.push(text);
        return <b>{text}</b>;
    };
    const { html, errors } = await renderServer({
        render: () => (
            <Timeline
                dataSource={[
                    { content: 'First', time: '2019-07-14' },
                    { content: 'Second', extra: 'note' },
                ]}
                renderContent={(item, index) => counted(`content ${index}:${item.content}`)}
                renderDot={(_, index) => counted(`dot ${index}`)}
                renderTime={(item) => counted(`time ${item.time}`)}
                renderExtra={(item) => counted(`extra ${item.extra}`)}
            />
        ),
    });
    expect(errors).toEqual([]);
    expect(created.toSorted()).toEqual(['content 0:First', 'content 1:Second', 'dot 0', 'dot 1', 'extra note', 'extra undefined', 'time 2019-07-14', 'time undefined']);
    expect(html).toMatch(/<b[^>]*>content 0:First<\/b>/);
});

it('timeline/dataSource 的项只放数据', () => {
    // @ts-expect-error nodes go through renderContent, renderDot, renderTime and renderExtra
    const jsxData: Data[] = [{ content: <b>First</b>, dot: <i /> }];
    expect(jsxData).toHaveLength(1);
});
