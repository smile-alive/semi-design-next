/** @jsxImportSource vue */
import { screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { IconPlus } from '@fibrae/semi-icons-vue';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import { render } from '@test/utils/vue';
import Upload, { type FileItem, type UploadHandle, type UploadProps } from '..';
import Button from '../../button';

const prefixCls = 'semi-upload';

const action = 'https://semi.design/upload';
function customRequest() {}
const readme = () => new File(['# Semi Design\n'], 'README.md', { type: 'text/markdown' });
const cardNames = (root: ParentNode = document) => [...root.querySelectorAll(`.${prefixCls}-file-card-info-name`)].map((el) => el.textContent?.trim());
const fileInputs = () => document.querySelectorAll<HTMLInputElement>('input[type=file]');
function query(selector: string, root: ParentNode = document) {
    const found = root.querySelector<HTMLElement>(selector);
    if (!found) throw new Error(`missing ${selector}`);
    return found;
}
const plus = () => <IconPlus />;
// A file drag cannot be started by the pointer, so the drag events carry a real DataTransfer
function dropFiles(area: HTMLElement, files: File[]) {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    ['dragenter', 'dragover', 'drop'].forEach((type) => area.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer })));
}

describe('Upload 图片卡片键盘焦点', () => {
    it('Tab 可以到达隐藏的卡片操作按钮，显示它们并绘制主题焦点环', async () => {
        const { container } = render(Upload, {
            props: {
                action,
                customRequest,
                defaultFileList: [{ uid: '1', name: 'a.png', status: 'uploadFail', url: '', size: '1KB' }],
                listType: 'picture',
                showRetry: true,
                onPreviewClick: () => {},
            },
            slots: { default: plus },
        });
        const trigger = query(`.${prefixCls}-preview-trigger`, container);
        await tabTo(trigger);
        expectThemeFocusRing(trigger);
        const retry = query(`.${prefixCls}-picture-file-card-retry`, container);
        expect(getComputedStyle(retry).opacity).toBe('1');
        await tabTo(retry);
        expectThemeFocusRing(retry);
        await tabTo(query(`.${prefixCls}-picture-file-card-close`, container));
    });
});

describe('Upload 图片卡片操作与指针', () => {
    it('悬停或聚焦卡片前，隐藏的操作按钮不响应指针点击', async () => {
        const onRemove = vi.fn<(file: unknown, fileList: FileItem[], fileItem: FileItem) => void>();
        const { container } = render(Upload, {
            props: {
                action,
                customRequest,
                defaultFileList: [{ uid: '1', name: 'a.png', status: 'success', url: '', size: '1KB' }],
                listType: 'picture',
                showReplace: true,
                onRemove,
            },
            slots: { default: plus },
        });
        const card = query(`.${prefixCls}-picture-file-card`, container);
        const controls = ['close', 'replace'].map((name) => query(`.${prefixCls}-picture-file-card-${name}`, container));
        const hitAtCenter = (el: Element) => {
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
        const { container } = render({
            render: () => (
                <>
                    <Upload action={action} customRequest={customRequest} defaultFileList={[{ uid: '1', name: 'a.txt', status: 'success', url: '', size: '1KB' }]} showReplace>
                        {{ default: plus }}
                    </Upload>
                    <Button data-testid="plain" size="small" theme="borderless" type="tertiary" />
                </>
            ),
        });
        const replace = query(`.${prefixCls}-file-card-replace`, container);
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
        const onFileChange = vi.fn<(files: File[]) => void>();
        render(Upload, {
            props: { action, crop: true, cropModalProps: { motion: false }, customRequest, onFileChange },
            slots: { default: () => <Button>{() => 'upload'}</Button> },
        });
        await userEvent.upload(fileInputs()[0], new File([gifBytes], 'anim.gif', { type: 'image/gif' }));
        await waitFor(() => expect(document.querySelector('.semi-cropper img')).not.toBeNull());
        await userEvent.click(await screen.findByRole('button', { name: '确定' }));
        await waitFor(() => expect(onFileChange).toHaveBeenCalledTimes(1));
        const [cropped] = onFileChange.mock.calls[0][0];
        expect([cropped.name, cropped.type]).toEqual(['anim.png', 'image/png']);
        const header = new Uint8Array(await cropped.slice(0, 4).arrayBuffer());
        expect([...header]).toEqual([0x89, 0x50, 0x4e, 0x47]);
    });
});

describe('Upload', () => {
    it('拖拽上传', async () => {
        render(Upload, {
            props: { accept: 'application/image/*,.md', action, customRequest, draggable: true },
            slots: {
                dragMainText: () => '点击上传文件或拖拽文件到这里',
                dragSubText: () => '支持的文件类型：.jpg、.pdf',
            },
        });
        dropFiles(query(`.${prefixCls}-drag-area`), [readme()]);
        await waitFor(() => expect(cardNames()).toEqual(['README.md']));
    });

    it('拖拽上传按带点的扩展名匹配，.md 不放行 notmd', async () => {
        render(Upload, { props: { accept: '.md', action, customRequest, draggable: true } });
        dropFiles(query(`.${prefixCls}-drag-area`), [new File(['x'], 'notmd', { type: 'text/plain' }), readme()]);
        await waitFor(() => expect(cardNames()).toEqual(['README.md']));
    });

    it('数量限制', async () => {
        render(Upload, {
            props: { action, customRequest, limit: 1 },
            slots: { default: () => <Button>{() => '点击上传'}</Button> },
        });
        await userEvent.upload(fileInputs()[0], readme());
        await waitFor(() => expect(cardNames()).toEqual(['README.md']));
        await userEvent.upload(fileInputs()[0], readme());
        await waitFor(() => expect(cardNames()).toEqual(['README.md']));
    });

    it('替换', async () => {
        const onSizeError = vi.fn<(file: File, fileList: FileItem[]) => void>();
        const props = { action, customRequest, onSizeError, maxSize: 1024, transformFile: (file: File) => file };
        const upload = (testId: string, extra: Partial<UploadProps>, label: string) => (
            <Upload {...props} {...extra} data-testid={testId}>
                {() => <Button>{() => label}</Button>}
            </Upload>
        );
        render(() => (
            <div>
                {upload('upload-any', { accept: '.md,image/*,video/*', minSize: 0 }, '点击上传（最小0kB，最大1MB）')}
                {upload('upload-image', { accept: 'image/*', minSize: 0 }, '只接受image点击上传（最小0kB，最大1MB）')}
                {upload('upload-min-size', { accept: '.md,image/*,video/*', minSize: 200 }, '点击上传（最小200kB，最大1MB）')}
            </div>
        ));
        // each Upload renders its select input followed by its replace input
        // not an acceptable type
        await userEvent.upload(fileInputs()[2], readme());
        // not an acceptable size
        await userEvent.upload(fileInputs()[4], readme());
        await waitFor(() => expect(onSizeError).toHaveBeenCalledTimes(1));

        await userEvent.upload(fileInputs()[0], readme());
        await waitFor(() => expect(cardNames(screen.getByTestId('upload-any'))).toEqual(['README.md']));
        expect(cardNames(screen.getByTestId('upload-image'))).toEqual([]);
    });

    it('ref 方法 insert', async () => {
        const onSizeError = vi.fn<(file: File, fileList: FileItem[]) => void>();
        const handles: (UploadHandle | null)[] = [null, null, null];
        let selected: File[] = [];
        const props = {
            action,
            customRequest,
            accept: '.md,image/*,video/*',
            maxSize: 1024,
            transformFile: (file: File) => file,
            onFileChange: (files: File[]) => {
                delete (files[0] as File & { uid?: string }).uid;
                selected = files;
            },
        };
        const upload = (index: number, extra: Partial<UploadProps> & Record<string, unknown>, label: string) => (
            <Upload
                {...props}
                {...extra}
                ref={(handle: unknown) => {
                    handles[index] = handle as UploadHandle | null;
                }}
            >
                {() => <Button>{() => label}</Button>}
            </Upload>
        );
        const insertButton = (index: number) => <Button onClick={() => handles[index]?.insert(selected, 0)}>{() => `插入首项上传${index + 1}`}</Button>;
        render(() => (
            <div>
                {upload(0, { limit: 1, minSize: 0 }, '选择文件 limit 1')}
                {upload(1, { limit: 2, minSize: 0 }, '选择文件 limit 2')}
                {upload(2, { limit: 1, minSize: 200, onSizeError }, '选择文件 size 限制')}
                {insertButton(0)}
                {insertButton(1)}
                {insertButton(2)}
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
        [
            'the retry button',
            {
                showRetry: true,
                defaultFileList: [{ uid: '1', name: 'a.txt', status: 'uploadFail', size: '1KB' }],
            },
            `.${prefixCls}-file-card-info-retry`,
        ],
    ])('%s 显示主题焦点环', async (_, props, selector) => {
        const { container } = render(Upload, {
            props: { action, customRequest, ...props },
            slots: { default: () => <span>upload</span> },
        });
        const el = query(selector, container);
        await tabTo(el);
        expectThemeFocusRing(el);
    });
});

describe('Upload 焦点保持', () => {
    const files = [1, 2, 3].map((n) => ({ uid: String(n), name: `${n}.txt`, status: 'success' as const, size: '1KB' }));

    it('移除获得焦点的文件卡片后，焦点落到同位置卡片的移除按钮', async () => {
        render(Upload, { props: { action, customRequest, defaultFileList: files } });
        const closes = () => [...document.querySelectorAll<HTMLElement>(`.${prefixCls}-file-card-close`)];
        await tabTo(closes()[1]);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(cardNames()).toEqual(['1.txt', '3.txt']));
        expect(document.activeElement).toBe(closes()[1]);
    });

    it('焦点已离开文件列表后卡片被移除，不把焦点拉回 Upload', async () => {
        const closes = () => [...document.querySelectorAll<HTMLElement>(`.${prefixCls}-file-card-close`)];
        const view = render(Upload, { props: { action, customRequest, fileList: files } });
        await tabTo(closes()[1]);
        (document.activeElement as HTMLElement).blur();
        await view.rerender({ fileList: files.filter((file) => file.uid !== '2') });
        await waitFor(() => expect(cardNames()).toEqual(['1.txt', '3.txt']));
        expect(document.activeElement).toBe(document.body);
    });

    it('空图片墙添加第一个文件后，焦点仍在添加按钮上', async () => {
        const { container } = render(Upload, { props: { action, customRequest, listType: 'picture' }, slots: { default: plus } });
        await tabTo(query(`.${prefixCls}-picture-add`, container));
        const input = query(`.${prefixCls}-hidden-input`, container) as HTMLInputElement;
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
        const { container } = render(Upload, {
            props: { action, customRequest, defaultFileList: [{ uid: '1', name: 'a.txt', status: 'uploadFail', size: '1KB', validateMessage }], showRetry: true },
        });
        return query(`.${prefixCls}-file-card-info-retry`, container).getBoundingClientRect().width;
    };

    it('提示文字很长时，重试按钮保持单行原宽，不按字换行', () => {
        expect(retryWidth('文件大小超出限制，请重新选择后再次上传')).toBe(retryWidth('失败'));
    });
});
