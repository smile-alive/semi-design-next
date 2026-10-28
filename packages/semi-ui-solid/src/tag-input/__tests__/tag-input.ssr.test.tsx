import { expect, it } from 'vite-plus/test';
import { renderServer, serverText } from '@test/solid/ssr.solid';
import TagInput from '..';

it('超出 maxTagCount 的标签不在首帧创建', async () => {
    const rendered: string[] = [];
    const { html, errors } = await renderServer({
        render: () => (
            <TagInput
                defaultValue={['semi', 'design', 'solid']}
                maxTagCount={1}
                showRestTagsPopover
                renderTagItem={(value) => {
                    rendered.push(value);
                    return <span>{value}</span>;
                }}
            />
        ),
    });
    expect(errors).toEqual([]);
    expect(serverText(html)).toContain('+2');
    expect(rendered).toEqual(['semi']);
});
