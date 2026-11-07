import type { JSX } from 'solid-js';
import { expect, expectTypeOf, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import AIChatInput from '..';
import type { RenderUploadButtonProps } from '../interface';

it('类型：renderUploadButton 的 defaultNode 是渲染函数', () => {
    expectTypeOf<RenderUploadButtonProps['defaultNode']>().toEqualTypeOf<() => JSX.Element>();
});

it('renderUploadButton 在插入处调用 defaultNode', async () => {
    const { html, errors } = await renderServer({
        render: () => <AIChatInput renderUploadButton={(args) => <span class="custom-upload">{args.defaultNode()}</span>} />,
    });
    expect(errors).toEqual([]);
    expect(html).toContain('custom-upload');
    expect(html.match(/footer-action-upload/g)).toHaveLength(1);
});

it.each<[string, () => JSX.Element]>([
    ['默认', () => <AIChatInput />],
    ['有上传提示', () => <AIChatInput uploadTipProps={{ content: 'Tip' }} />],
    ['renderUploadButton 插入默认按钮', () => <AIChatInput renderUploadButton={(args) => <span>{args.defaultNode()}</span>} />],
])('ai-chat-input/%s 时上传区在服务端不输出按钮角色', async (_, render) => {
    const { html, errors } = await renderServer({ render });
    expect(errors).toEqual([]);
    const tag = html.match(/<div[^>]*class="semi-upload-add(?: [^"]*)?"[^>]*>/)?.[0];
    expect(tag).toBeDefined();
    expect(tag).not.toContain('role="button"');
    expect(tag?.toLowerCase()).not.toContain('tabindex');
});

it('renderUploadButton 不调用 defaultNode 时，不创建默认按钮', async () => {
    const { html, errors } = await renderServer({
        render: () => <AIChatInput renderUploadButton={() => <span class="custom-upload" />} />,
    });
    expect(errors).toEqual([]);
    expect(html).toContain('custom-upload');
    expect(html).not.toContain('footer-action-upload');
});
