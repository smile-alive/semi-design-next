import type { JSX } from 'solid-js';
import { expect, it } from 'vite-plus/test';
import { IconUpload } from '@fibrae/semi-icons-solid';
import { renderServer } from '@test/solid/ssr.solid';
import Upload from '..';
import Button from '../../button';
import IconButton from '../../icon-button';

const action = 'https://example.com/upload';
const url = 'https://example.com/a.png';

function openingTag(html: string, className: string) {
    return html.match(new RegExp(`<div[^>]*class="${className}(?: [^"]*)?"[^>]*>`))?.[0];
}

it.each<[string, string, () => JSX.Element]>([
    [
        '默认',
        'semi-upload-add',
        () => (
            <Upload action={action}>
                <Button icon={<IconUpload />}>Upload</Button>
            </Upload>
        ),
    ],
    [
        'picture',
        'semi-upload-add',
        () => (
            <Upload action={action} listType="picture">
                <Button>Upload</Button>
            </Upload>
        ),
    ],
    [
        'draggable 嵌套',
        'semi-upload-drag-area',
        () => (
            <Upload action={action} draggable>
                <div>
                    <IconButton aria-label="Upload" icon={<IconUpload />} />
                </div>
            </Upload>
        ),
    ],
])('upload/%s 添加区域内有 Button 时服务端不输出按钮角色', async (_, className, render) => {
    const { html, errors } = await renderServer({ render });
    expect(errors).toEqual([]);
    const tag = openingTag(html, className);
    expect(tag).toBeDefined();
    expect(tag).not.toContain('role="button"');
    expect(tag?.toLowerCase()).not.toContain('tabindex');
});

it('upload/内容中无控件时服务端输出按钮角色', async () => {
    const { html, errors } = await renderServer({
        render: () => (
            <Upload action={action}>
                <span>Upload</span>
            </Upload>
        ),
    });
    expect(errors).toEqual([]);
    expect(openingTag(html, 'semi-upload-add')).toContain('role="button"');
});

it('图片墙在服务端不读取成功文件的校验信息', async () => {
    const created: string[] = [];
    const { errors } = await renderServer({
        render: () => (
            <Upload
                action={action}
                listType="picture"
                defaultFileList={[
                    {
                        uid: '1',
                        name: 'a.png',
                        status: 'success',
                        size: '1KB',
                        url,
                        // @ts-expect-error the message is text; nodes go through renderValidateMessage
                        get validateMessage() {
                            created.push('message');
                            return <span>Invalid</span>;
                        },
                    },
                ]}
            />
        ),
    });
    expect(errors).toEqual([]);
    expect(created).toEqual([]);
});

// the message shows in the tooltip, which opens after mount
it('图片墙在服务端不调用 renderValidateMessage', async () => {
    const created: string[] = [];
    const { html, errors } = await renderServer({
        render: () => (
            <Upload
                action={action}
                listType="picture"
                defaultFileList={[{ uid: '1', name: 'a.png', status: 'validateFail', size: '1KB', url, validateMessage: 'Invalid' }]}
                renderValidateMessage={(file) => {
                    created.push(file.name);
                    return <b>{file.validateMessage}</b>;
                }}
            />
        ),
    });
    expect(errors).toEqual([]);
    expect(html).toContain('semi-upload-picture-file-card-icon-error');
    expect(created).toEqual([]);
});
