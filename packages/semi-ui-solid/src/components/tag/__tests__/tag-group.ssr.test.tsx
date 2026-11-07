import { expect, it } from 'vite-plus/test';
import { renderServer, serverText } from '@test/solid/ssr.solid';
import { TagGroup } from '..';

it('renderTag 不创建超出 maxTagCount 的项', async () => {
    const created: string[] = [];
    const { html, errors } = await renderServer({
        render: () => (
            <TagGroup
                maxTagCount={1}
                showPopover
                tagList={[{ tagKey: 'a' }, { tagKey: 'b' }, { tagKey: 'c' }]}
                renderTag={(tag) => {
                    created.push(tag.tagKey as string);
                    return <span>{tag.tagKey}</span>;
                }}
            />
        ),
    });
    expect(errors).toEqual([]);
    expect(serverText(html)).toContain('+2');
    expect(created).toEqual(['a']);
});
