import { createSignal } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconPlus } from '@fibrae/semi-icons-solid';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import Upload, { type FileItem, type UploadHandle, type UploadProps } from '..';
import Button from '../../button';
import { Form, FormUpload } from '../../form';

const prefixCls = `${BASE_CLASS_PREFIX}-upload`;

const action = 'https://semi.design/upload';
const customRequest = () => {};
const readme = () => new File(['# Semi Design\n'], 'README.md', { type: 'text/markdown' });
const cardNames = (root: ParentNode = document) => [...root.querySelectorAll(`.${prefixCls}-file-card-info-name`)].map((el) => el.textContent);
const fileInputs = () => document.querySelectorAll<HTMLInputElement>('input[type=file]');
const query = (root: ParentNode, selector: string) => root.querySelector(selector) as HTMLElement;

describe('Upload（浏览器）', () => {
    // fix #2448: inside FormUpload the error outline of a failed picture card was hidden, so the card also draws
    // the error color as a border, kept inside its 96px box
    it('修复 #2448：FormUpload 中上传失败的图片卡片在卡片内显示错误边框', () => {
        const { container } = render(() => (
            <Form>
                <FormUpload multiple accept="image/*" action={action} field="files" initValue={[{ uid: '1', name: 'dy.png', status: 'uploadFail', url: '' }]} listType="picture">
                    <IconPlus size="extra-large" />
                </FormUpload>
            </Form>
        ));
        const card = query(container, `.${prefixCls}-picture-file-card-error`);
        expect(card).not.toBeNull();
        const style = getComputedStyle(card);
        expect(style.borderTopStyle).toBe('solid');
        expect(style.borderTopWidth).toBe('1px');
        expect(style.borderTopColor).toBe(style.outlineColor);
        expect(style.borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
        const { width, height } = card.getBoundingClientRect();
        expect(width).toBe(96);
        expect(height).toBe(96);
    });
});

describe('Upload 图片卡片键盘焦点', () => {
    it('Tab 可以到达隐藏的卡片操作按钮，显示它们并绘制主题焦点环', async () => {
        const { container } = render(() => (
            <Upload action={action} customRequest={customRequest} defaultFileList={[{ uid: '1', name: 'a.png', status: 'uploadFail', url: '', size: '1KB' }]} listType="picture" showRetry onPreviewClick={() => {}}>
                <IconPlus />
            </Upload>
        ));
        const trigger = query(container, `.${prefixCls}-preview-trigger`);
        await tabTo(trigger);
        expectThemeFocusRing(trigger);
        const retry = query(container, `.${prefixCls}-picture-file-card-retry`);
        expect(getComputedStyle(retry).opacity).toBe('1');
        await tabTo(retry);
        expectThemeFocusRing(retry);
        await tabTo(query(container, `.${prefixCls}-picture-file-card-close`));
    });
});

describe('Upload 图片卡片操作与指针', () => {
    it('悬停或聚焦卡片前，隐藏的操作按钮不响应指针点击', async () => {
        const onRemove = vi.fn<NonNullable<UploadProps['onRemove']>>();
        const { container } = render(() => (
            <Upload action={action} customRequest={customRequest} defaultFileList={[{ uid: '1', name: 'a.png', status: 'success', url: '', size: '1KB' }]} listType="picture" showReplace onRemove={onRemove}>
                <IconPlus />
            </Upload>
        ));
        const card = query(container, `.${prefixCls}-picture-file-card`);
        const controls = ['close', 'replace'].map((name) => query(container, `.${prefixCls}-picture-file-card-${name}`));
        const hitAtCenter = (el: HTMLElement) => {
            const { left, top, width, height } = el.getBoundingClientRect();
            return document.elementFromPoint(left + width / 2, top + height / 2);
        };
        controls.forEach((el) => {
            expect(getComputedStyle(el).opacity).toBe('0');
            expect(el.contains(hitAtCenter(el))).toBe(false);
        });

        await userEvent.hover(card);
        controls.forEach((el) => expect(el.contains(hitAtCenter(el))).toBe(true));
        await userEvent.unhover(card);

        await tabTo(controls[0]);
        controls.forEach((el) => expect(el.contains(hitAtCenter(el))).toBe(true));
        expect(onRemove).not.toHaveBeenCalled();
    });
});

describe('Upload 列表模式替换按钮', () => {
    it('Tooltip 直接包住按钮：没有外层 span，按钮保持 inline-flex 与原有间距，颜色与普通 tertiary 按钮一致', () => {
        const { container } = render(() => (
            <>
                <Upload action={action} customRequest={customRequest} defaultFileList={[{ uid: '1', name: 'a.txt', status: 'success', url: '', size: '1KB' }]} showReplace>
                    <IconPlus />
                </Upload>
                <Button type="tertiary" data-testid="plain" size="small" theme="borderless" />
            </>
        ));
        const replace = query(container, `.${prefixCls}-file-card-replace`);
        expect(replace.tagName).toBe('BUTTON');
        expect(replace.parentElement?.classList.contains(`${prefixCls}-tooltip-children-wrapper`)).toBe(false);
        const style = getComputedStyle(replace);
        const plain = getComputedStyle(screen.getByTestId('plain'));
        expect(style.display).toBe('inline-flex');
        expect(style.marginInlineStart).toBe('8px');
        expect(style.color).toBe(plain.color);
    });
});

describe('Upload 裁剪输出', () => {
    // 1x1 gif; the canvas cannot encode gif, so the browser answers toBlob with png bytes
    const gifBytes = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), (c) => c.charCodeAt(0));

    it('裁剪 GIF 后得到的文件类型与扩展名和实际编码一致', async () => {
        const onFileChange = vi.fn<NonNullable<UploadProps['onFileChange']>>();
        render(() => (
            <Upload action={action} crop cropModalProps={{ motion: false }} customRequest={customRequest} onFileChange={onFileChange}>
                <Button>upload</Button>
            </Upload>
        ));
        await userEvent.upload(fileInputs()[0], new File([gifBytes], 'anim.gif', { type: 'image/gif' }));
        // the cropper hands out a canvas only after its image has loaded
        await waitFor(() => expect(document.querySelector(`.${BASE_CLASS_PREFIX}-cropper img`)).not.toBeNull());
        await userEvent.click(await screen.findByRole('button', { name: '确定' }));
        await waitFor(() => expect(onFileChange).toHaveBeenCalledTimes(1));
        const [cropped] = onFileChange.mock.calls[0][0];
        expect([cropped.name, cropped.type]).toEqual(['anim.png', 'image/png']);
        const header = new Uint8Array(await cropped.slice(0, 4).arrayBuffer());
        expect([...header]).toEqual([0x89, 0x50, 0x4e, 0x47]);
    });
});

describe('Upload', () => {
    // A file drag cannot be started by the pointer, so the drag events carry a real DataTransfer like a drop from the OS
    const dropOn = (area: HTMLElement, files: File[]) => {
        const dataTransfer = new DataTransfer();
        files.forEach((file) => dataTransfer.items.add(file));
        ['dragenter', 'dragover', 'drop'].forEach((type) => area.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer })));
    };

    it('拖拽上传', async () => {
        render(() => <Upload accept="application/image/*,.md" action={action} customRequest={customRequest} draggable dragMainText="点击上传文件或拖拽文件到这里" dragSubText="支持的文件类型：.jpg、.pdf" />);
        dropOn(query(document, `.${prefixCls}-drag-area`), [readme()]);
        await waitFor(() => expect(cardNames()).toEqual(['README.md']));
    });

    it('拖拽上传按带点的扩展名匹配，.md 不放行 notmd', async () => {
        render(() => <Upload accept=".md" action={action} customRequest={customRequest} draggable />);
        dropOn(query(document, `.${prefixCls}-drag-area`), [new File(['x'], 'notmd', { type: 'text/plain' }), readme()]);
        await waitFor(() => expect(cardNames()).toEqual(['README.md']));
    });

    it('数量限制', async () => {
        render(() => (
            <Upload action={action} customRequest={customRequest} limit={1}>
                <Button>点击上传</Button>
            </Upload>
        ));
        await userEvent.upload(fileInputs()[0], readme());
        await waitFor(() => expect(cardNames()).toEqual(['README.md']));
        await userEvent.upload(fileInputs()[0], readme());
        await waitFor(() => expect(cardNames()).toEqual(['README.md']));
    });

    it('替换', async () => {
        const onSizeError = vi.fn<NonNullable<UploadProps['onSizeError']>>();
        const props = { action, customRequest, onSizeError, maxSize: 1024, transformFile: (file: File) => file };
        render(() => (
            <>
                <Upload {...props} data-testid="upload-any" accept=".md,image/*,video/*" minSize={0}>
                    <Button>点击上传（最小0kB，最大1MB）</Button>
                </Upload>
                <Upload {...props} data-testid="upload-image" accept="image/*" minSize={0}>
                    <Button>只接受image点击上传（最小0kB，最大1MB）</Button>
                </Upload>
                <Upload {...props} data-testid="upload-min-size" accept=".md,image/*,video/*" minSize={200}>
                    <Button>点击上传（最小200kB，最大1MB）</Button>
                </Upload>
            </>
        ));
        // each Upload owns a trigger input followed by its replace input
        await userEvent.upload(fileInputs()[2], readme());
        await userEvent.upload(fileInputs()[4], readme());
        await waitFor(() => expect(onSizeError).toHaveBeenCalledTimes(1));

        await userEvent.upload(fileInputs()[0], readme());
        await waitFor(() => expect(cardNames(screen.getByTestId('upload-any'))).toEqual(['README.md']));
        expect(cardNames(screen.getByTestId('upload-image'))).toEqual([]);
    });

    it('ref 方法 insert', async () => {
        const onSizeError = vi.fn<NonNullable<UploadProps['onSizeError']>>();
        const handles: UploadHandle[] = [];
        let selected: File[] = [];
        const props = {
            action,
            customRequest,
            accept: '.md,image/*,video/*',
            maxSize: 1024,
            transformFile: (file: File) => file,
            onFileChange: (files: File[]) => {
                Reflect.deleteProperty(files[0], 'uid');
                selected = files;
            },
        };
        render(() => (
            <div>
                <Upload {...props} ref={(handle: UploadHandle) => (handles[0] = handle)} limit={1} minSize={0}>
                    <Button>选择文件 limit 1</Button>
                </Upload>
                <Upload {...props} ref={(handle: UploadHandle) => (handles[1] = handle)} limit={2} minSize={0}>
                    <Button>选择文件 limit 2</Button>
                </Upload>
                <Upload {...props} ref={(handle: UploadHandle) => (handles[2] = handle)} limit={1} minSize={200} onSizeError={onSizeError}>
                    <Button>选择文件 size 限制</Button>
                </Upload>
                <Button onClick={() => handles[0].insert(selected, 0)}>插入首项上传1</Button>
                <Button onClick={() => handles[1].insert(selected, 0)}>插入首项上传2</Button>
                <Button onClick={() => handles[2].insert(selected, 0)}>插入首项上传3</Button>
            </div>
        ));
        const listItems = () => document.querySelectorAll(`.${prefixCls}-file-list div[role="listitem"]`);

        await userEvent.upload(fileInputs()[0], readme());
        await userEvent.upload(fileInputs()[0], readme());
        await waitFor(() => expect(listItems()).toHaveLength(1));

        await userEvent.click(screen.getByText('插入首项上传1'));
        await userEvent.click(screen.getByText('插入首项上传1'));
        await waitFor(() => expect(listItems()).toHaveLength(1));

        await userEvent.click(screen.getByText('插入首项上传2'));
        await userEvent.click(screen.getByText('插入首项上传2'));
        await waitFor(() => expect(listItems()).toHaveLength(3));

        await userEvent.click(screen.getByText('插入首项上传3'));
        await waitFor(() => expect(onSizeError).toHaveBeenCalled());
    });

    it.each<[string, Partial<UploadProps>, string]>([
        ['the trigger', {}, `.${prefixCls}-add`],
        ['the drag area', { draggable: true }, `.${prefixCls}-drag-area`],
        ['the picture trigger', { listType: 'picture' }, `.${prefixCls}-picture-add`],
        ['the clear button', { defaultFileList: [{ uid: '1', name: 'a.txt', status: 'success', size: '1KB' }] }, `.${prefixCls}-file-list-title-clear`],
        ['the retry button', { showRetry: true, defaultFileList: [{ uid: '1', name: 'a.txt', status: 'uploadFail', size: '1KB' }] }, `.${prefixCls}-file-card-info-retry`],
    ])('%s 显示主题焦点环', async (_, props, selector) => {
        const { container } = render(() => (
            <Upload action={action} customRequest={customRequest} {...props}>
                <span>upload</span>
            </Upload>
        ));
        const el = query(container, selector);
        await tabTo(el);
        expectThemeFocusRing(el);
    });
});

describe('Upload 焦点保持', () => {
    const files: FileItem[] = [1, 2, 3].map((n) => ({ uid: String(n), name: `${n}.txt`, status: 'success' as const, size: '1KB' }));
    const closes = () => [...document.querySelectorAll<HTMLElement>(`.${prefixCls}-file-card-close`)];

    it('移除获得焦点的文件卡片后，焦点落到同位置卡片的移除按钮', async () => {
        render(() => <Upload action={action} customRequest={customRequest} defaultFileList={files} />);
        await tabTo(closes()[1]);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(cardNames()).toEqual(['1.txt', '3.txt']));
        expect(document.activeElement).toBe(closes()[1]);
    });

    it('禁用后获得焦点的移除按钮消失，焦点留在 Upload 内', async () => {
        const [disabled, setDisabled] = createSignal(false);
        const { container } = render(() => <Upload action={action} customRequest={customRequest} defaultFileList={files} disabled={disabled()} />);
        await tabTo(closes()[1]);
        setDisabled(true);
        expect(closes()).toHaveLength(0);
        expect(document.activeElement).not.toBe(document.body);
        expect(container.contains(document.activeElement)).toBe(true);
    });

    it('焦点已离开文件列表后卡片被移除，不把焦点拉回 Upload', async () => {
        const [fileList, setFileList] = createSignal(files);
        render(() => <Upload action={action} customRequest={customRequest} fileList={fileList()} />);
        await tabTo(closes()[1]);
        (document.activeElement as HTMLElement).blur();
        await Promise.resolve();
        setFileList(files.filter((file) => file.uid !== '2'));
        await waitFor(() => expect(cardNames()).toEqual(['1.txt', '3.txt']));
        expect(document.activeElement).toBe(document.body);
    });

    it('空图片墙添加第一个文件后，焦点仍在添加按钮上', async () => {
        render(() => (
            <Upload action={action} customRequest={customRequest} listType="picture">
                <IconPlus />
            </Upload>
        ));
        const add = query(document, `.${prefixCls}-picture-add`);
        await tabTo(add);
        const input = query(document, `.${prefixCls}-hidden-input`) as HTMLInputElement;
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(new File(['x'], 'a.png', { type: 'image/png' }));
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await waitFor(() => expect(document.querySelectorAll(`.${prefixCls}-picture-file-card`)).toHaveLength(1));
        expect(document.activeElement).toBe(document.querySelector(`.${prefixCls}-picture-add`));
    });
});

describe('Upload 失败状态信息行', () => {
    const retryWidth = (validateMessage: string) => {
        const { container } = render(() => <Upload action={action} customRequest={customRequest} defaultFileList={[{ uid: '1', name: 'a.txt', status: 'uploadFail', size: '1KB', validateMessage }]} showRetry />);
        return query(container, `.${prefixCls}-file-card-info-retry`).getBoundingClientRect().width;
    };

    it('提示文字很长时，重试按钮保持单行原宽，不按字换行', () => {
        expect(retryWidth('文件大小超出限制，请重新选择后再次上传')).toBe(retryWidth('失败'));
    });
});
