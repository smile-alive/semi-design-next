import { screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import type { FileItem } from '../interface';
import { click, createFile, defaultFileList, fn, getCardNames, getInput, getPicCards, installFakeXhr, lastFileList, prefix, query, renderUpload, selectFiles, type FakeXhr } from './helpers';

let requests: FakeXhr[];
beforeEach(() => {
    requests = installFakeXhr();
});

const pictureItems: FileItem[] = [
    { uid: '1', name: 'a.png', status: 'success', size: '1KB', url: 'https://example.com/a.png', preview: true },
    { uid: '2', name: 'b.png', status: 'uploadFail', size: '1KB', url: 'https://example.com/b.png', preview: true, validateMessage: 'broken' },
];

describe('Upload 文件列表', () => {
    it('list 类型：空列表不渲染列表，有文件时渲染 role=list 与标题', () => {
        const view = renderUpload();
        expect(document.querySelector(`.${prefix}-file-list`)).toBeNull();
        view.update({ fileList: defaultFileList });
        const list = query(`.${prefix}-file-list-main`);
        expect(list).toHaveAttribute('role', 'list');
        expect(list).toHaveAttribute('aria-label', '文件列表');
        expect(screen.getByText('已选择文件')).toBeInTheDocument();
        expect(getCardNames()).toEqual(['vigo.png', 'test.jpeg']);
    });

    it('showUploadList 为 false 时不渲染列表', () => {
        renderUpload({ fileList: defaultFileList, showUploadList: false });
        expect(document.querySelector(`.${prefix}-file-list`)).toBeNull();
    });

    it('showClear 为 false 或 disabled 时没有清空按钮；limit=1 时没有标题栏', () => {
        const view = renderUpload({ fileList: defaultFileList, showClear: false });
        expect(screen.queryByRole('button', { name: '清空' })).toBeNull();
        view.update({ showClear: true, disabled: true });
        expect(screen.queryByRole('button', { name: '清空' })).toBeNull();
        view.update({ disabled: false, limit: 1 });
        expect(document.querySelector(`.${prefix}-file-list-title`)).toBeNull();
    });

    it('disabled 时没有删除按钮', () => {
        renderUpload({ fileList: defaultFileList, disabled: true });
        expect(document.querySelector(`.${prefix}-file-card-close`)).toBeNull();
        expect(query(`.${prefix}`)).toHaveClass(`${prefix}-disabled`);
    });

    it('上传中的文件显示进度条，完成后消失', async () => {
        renderUpload();
        await selectFiles([createFile(100, 'p.png')]);
        await requests[0].uploadProgress({ loaded: 50, total: 100 });
        expect(screen.getByRole('progressbar', { name: '文件上传进度' })).toBeInTheDocument();
        await requests[0].respond(200, '{}');
        expect(screen.queryByRole('progressbar')).toBeNull();
    });

    it('validateStatus 输出对应 class', () => {
        const view = renderUpload({ validateStatus: 'error' });
        expect(query(`.${prefix}`)).toHaveClass(`${prefix}-error`);
        view.update({ validateStatus: 'success' });
        expect(query(`.${prefix}`)).toHaveClass(`${prefix}-success`);
    });

    it('onPreviewClick：点击卡片与键盘触发按钮都触发预览', async () => {
        const onPreviewClick = fn();
        renderUpload({ fileList: defaultFileList, onPreviewClick });
        await click(query(`.${prefix}-file-card`));
        expect(onPreviewClick).toHaveBeenCalledTimes(1);
        expect(onPreviewClick.mock.calls[0][0].uid).toBe('1');
        await click(screen.getAllByRole('button', { name: '预览' })[1]);
        expect(onPreviewClick).toHaveBeenCalledTimes(2);
    });

    it('file.preview 的图片加载失败时回退到文件图标', async () => {
        renderUpload({ fileList: [defaultFileList[0]] });
        const img = query<HTMLImageElement>(`.${prefix}-file-card-preview img`);
        img.dispatchEvent(new Event('error'));
        await waitFor(() => expect(document.querySelector(`.${prefix}-file-card-preview img`)).toBeNull());
        expect(query(`.${prefix}-file-card-preview`)).toHaveClass(`${prefix}-file-card-preview-placeholder`);
    });

    it('itemStyle 作用在每张卡片上', () => {
        renderUpload({ fileList: defaultFileList, itemStyle: 'margin-top: 7px' });
        expect(query(`.${prefix}-file-card`)).toHaveStyle({ marginTop: '7px' });
    });

    it('size 为数字的文件项显示格式化后的大小', () => {
        renderUpload({ fileList: [{ uid: 'n', name: 'n.png', status: 'success', size: 2048 as unknown as string }] });
        expect(query(`.${prefix}-file-card-info-size`)).toHaveTextContent('2.0KB');
    });

    it('validateMessage 与 prompt 与 validateStatus 文案', () => {
        renderUpload({ fileList: pictureItems }, { snippets: ['prompt', 'validateMessage'] });
        expect(query(`.${prefix}-prompt`)).toHaveTextContent('Some info for extra text');
        expect(query(`.${prefix}-validate-message`)).toHaveTextContent('test');
        expect(screen.getByText('broken')).toBeInTheDocument();
    });

    it('promptPosition 输出 x-prompt-pos', () => {
        renderUpload({ promptPosition: 'bottom' });
        expect(query(`.${prefix}`)).toHaveAttribute('x-prompt-pos', 'bottom');
    });
});

describe('Upload 图片墙', () => {
    it('picture 类型：渲染图片卡、添加按钮，默认 hotSpotLocation 在末尾', () => {
        renderUpload({ listType: 'picture', fileList: pictureItems });
        expect(query(`.${prefix}`)).toHaveClass(`${prefix}-picture`);
        expect(query(`.${prefix}-picture-list`)).toHaveAttribute('role', 'list');
        expect(getPicCards()).toHaveLength(2);
        const wall = query(`.${prefix}-file-list-main`);
        expect(wall.lastElementChild).toHaveClass(`${prefix}-picture-add`);
        expect(getPicCards()[1]).toHaveClass(`${prefix}-picture-file-card-error`);
    });

    it('hotSpotLocation 为 start 时添加按钮在最前', () => {
        renderUpload({ listType: 'picture', fileList: pictureItems, hotSpotLocation: 'start' });
        expect(query(`.${prefix}-file-list-main`).firstElementChild).toHaveClass(`${prefix}-picture-add`);
    });

    it('空列表仍渲染添加按钮，达到 limit 后隐藏', async () => {
        const view = renderUpload({ listType: 'picture', limit: 1 });
        expect(document.querySelector(`.${prefix}-picture-add`)).not.toBeNull();
        await selectFiles([createFile(10, 'x.png')]);
        expect(getPicCards()).toHaveLength(1);
        expect(document.querySelector(`.${prefix}-picture-add`)).toBeNull();
        view.update({ limit: 2 });
        expect(document.querySelector(`.${prefix}-picture-add`)).not.toBeNull();
    });

    it('showUploadList 为 false 时仍有添加按钮，没有图片卡', () => {
        renderUpload({ listType: 'picture', fileList: pictureItems, showUploadList: false });
        expect(getPicCards()).toHaveLength(0);
        expect(document.querySelector(`.${prefix}-picture-add`)).not.toBeNull();
    });

    it('picWidth 与 picHeight 作用在图片卡与添加按钮', () => {
        renderUpload({ listType: 'picture', fileList: pictureItems, picWidth: 90, picHeight: 80 });
        expect(getPicCards()[0]).toHaveStyle({ width: '90px', height: '80px' });
        expect(query(`.${prefix}-picture-add`)).toHaveStyle({ width: '90px', height: '80px' });
    });

    it('showPicInfo 显示序号，picInfo snippet 替换它', () => {
        const view = renderUpload({ listType: 'picture', fileList: pictureItems, showPicInfo: true });
        expect(Array.from(document.querySelectorAll(`.${prefix}-picture-file-card-pic-info`)).map((node) => node.textContent)).toEqual(['1', '2']);
        view.unmount();
        renderUpload({ listType: 'picture', fileList: pictureItems, showPicInfo: true }, { snippets: ['picInfo'] });
        expect(Array.from(document.querySelectorAll('.custom-pic-info')).map((node) => node.textContent)).toEqual(['a.png', 'b.png']);
    });

    it('点击删除按钮移除图片，picClose snippet 的 onRemove 也生效', async () => {
        const onChange = fn();
        renderUpload({ listType: 'picture', fileList: pictureItems, onChange }, { snippets: ['picClose'] });
        await click(screen.getAllByRole('button', { name: 'X' })[0]);
        await waitFor(() => expect(lastFileList(onChange).map((item) => item.uid)).toEqual(['2']));
    });

    it('点击添加按钮打开文件选择框，键盘 Enter 同样打开', async () => {
        const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
        const onOpenFileDialog = fn();
        renderUpload({ listType: 'picture', onOpenFileDialog });
        await click(query(`.${prefix}-picture-add`));
        expect(inputClick.mock.contexts).toContain(getInput());
        expect(onOpenFileDialog).toHaveBeenCalledTimes(1);
        inputClick.mockRestore();
    });

    it('picPreviewIcon 只出现在上传成功的图片上', () => {
        renderUpload({ listType: 'picture', fileList: pictureItems }, { snippets: ['picPreviewIcon'] });
        expect(document.querySelectorAll('.custom-preview-icon')).toHaveLength(1);
    });

    it('校验失败的图片显示错误图标，校验文案只在 message 为字符串时出现', () => {
        renderUpload({ listType: 'picture', fileList: [...pictureItems, { uid: '3', name: 'c.png', status: 'success', size: '1KB', url: 'https://example.com/c.png' }] });
        expect(getPicCards()[1].querySelector(`.${prefix}-picture-file-card-icon-error`)).not.toBeNull();
        expect(getPicCards()[2].querySelector(`.${prefix}-picture-file-card-icon-error`)).toBeNull();
    });

    it('图片卡 disabled 时没有删除与添加响应', async () => {
        const onOpenFileDialog = fn();
        renderUpload({ listType: 'picture', fileList: pictureItems, disabled: true, onOpenFileDialog });
        expect(document.querySelector(`.${prefix}-picture-file-card-close`)).toBeNull();
        expect(getPicCards()[0]).toHaveClass(`${prefix}-picture-file-card-disabled`);
        await click(query(`.${prefix}-picture-add`));
        expect(onOpenFileDialog).not.toHaveBeenCalled();
    });

    it('重试按钮重新上传失败的图片', async () => {
        const onRetry = fn();
        renderUpload({
            listType: 'picture',
            fileList: [{ uid: '9', name: 'r.png', status: 'uploadFail', size: '1KB', url: 'https://example.com/r.png', fileInstance: createFile(10, 'r.png') }],
            onRetry,
        });
        await click(screen.getByRole('button', { name: '重试' }));
        expect(onRetry).toHaveBeenCalledTimes(1);
        expect(requests).toHaveLength(1);
    });
});

describe('Upload snippet', () => {
    it('dragIcon、dragMainText、dragSubText 替换拖拽区默认内容', () => {
        renderUpload({ draggable: true }, { trigger: 'none', snippets: ['dragIcon', 'dragMainText', 'dragSubText'] });
        expect(query(`.${prefix}-drag-area-main-text`)).toHaveTextContent('Drop files here to upload or Click to browse files');
        expect(query(`.${prefix}-drag-area-sub-text`)).toHaveTextContent('Only support jpeg / pdf');
        expect(query(`.${prefix}-drag-area-icon svg`)).not.toBeNull();
    });

    it('不传 snippet 时拖拽区显示语言包文案', () => {
        renderUpload({ draggable: true }, { trigger: 'none' });
        expect(query(`.${prefix}-drag-area-main-text`)).toHaveTextContent('点击上传文件或拖拽文件到这里');
        expect(query(`.${prefix}-drag-area-sub-text`)).toBeEmptyDOMElement();
    });

    it('fileListTitle 与 fileListHeader', () => {
        const view = renderUpload({ fileList: defaultFileList }, { snippets: ['fileListTitle'] });
        expect(query(`.${prefix}-file-list-title-choosen`)).toHaveTextContent('我的文件');
        view.unmount();
        renderUpload({ fileList: defaultFileList }, { snippets: ['fileListHeader'] });
        expect(screen.getByRole('button', { name: '2 清空' })).toBeInTheDocument();
        expect(document.querySelector(`.${prefix}-file-list-title-clear`)).toBeNull();
    });

    it('fileListHeader 的 onClear 清空列表', async () => {
        const onChange = fn();
        renderUpload({ fileList: defaultFileList, onChange }, { snippets: ['fileListHeader'] });
        await click(screen.getByRole('button', { name: '2 清空' }));
        await waitFor(() => expect(onChange).toHaveBeenCalledWith({ fileList: [] }));
    });

    it('fileItem 替换整张卡片，onReplace 与 onPreviewClick 可用', async () => {
        const view = renderUpload({ fileList: defaultFileList }, { snippets: ['fileItem'] });
        expect(Array.from(document.querySelectorAll('.customRender')).map((node) => node.textContent)).toEqual(['vigo.png', 'test.jpeg']);
        expect(document.querySelector(`.${prefix}-file-card`)).toBeNull();
        view.unmount();

        const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
        const replaceView = renderUpload({ fileList: [defaultFileList[0]], showReplace: true }, { snippets: ['fileItemReplace'] });
        await click(screen.getByRole('button', { name: 'replace vigo.png' }));
        expect(inputClick).toHaveBeenCalled();
        inputClick.mockRestore();
        replaceView.unmount();

        const onPreviewClick = fn();
        renderUpload({ fileList: [defaultFileList[0]], onPreviewClick }, { snippets: ['fileItemPreview'] });
        await click(screen.getByRole('button', { name: 'preview vigo.png' }));
        expect(onPreviewClick).toHaveBeenCalledTimes(1);
    });

    it('在 fileItem 中复用 Upload.FileCard，卡片 props 透传', () => {
        renderUpload({ fileList: defaultFileList }, { snippets: ['fileItemCard'] });
        const cards = document.querySelectorAll(`.${prefix}-file-card`);
        expect(cards).toHaveLength(1);
        expect(cards[0]).toHaveClass('via-slot');
    });

    it('previewFile、thumbnail、fileOperation 收到文件项与序号', () => {
        const seen: Record<string, unknown[]> = {};
        const view = renderUpload({ fileList: defaultFileList }, { snippets: ['recordedPreviewFile', 'recordedFileOperation'], seen });
        expect(seen.previewFile).toEqual([
            ['https://example.com/bag.jpeg', 0],
            ['https://example.com/bag.jpeg', 1],
        ]);
        expect(seen.fileOperation).toHaveLength(2);
        expect(document.querySelector(`.${prefix}-file-card-close`)).toBeNull();
        view.unmount();

        renderUpload({ listType: 'picture', fileList: pictureItems }, { snippets: ['recordedThumbnail'], seen });
        expect(seen.thumbnail).toEqual([
            ['https://example.com/a.png', 0],
            ['https://example.com/b.png', 1],
        ]);
    });

    it('thumbnail 与 previewFile 的字面 snippet', () => {
        const view = renderUpload({ listType: 'picture', fileList: pictureItems }, { snippets: ['thumbnail'] });
        expect(document.querySelectorAll('.custom-thumbnail')).toHaveLength(2);
        view.unmount();
        renderUpload({ fileList: defaultFileList }, { snippets: ['previewFile'] });
        expect(screen.getAllByTestId('custom-preview')).toHaveLength(2);
    });

    it('fileValidateMessage 替换文件卡的校验文案，并收到 validateMessage', () => {
        renderUpload({ fileList: pictureItems }, { snippets: ['fileValidateMessage'] });
        expect(document.querySelectorAll('.custom-msg')[1]).toHaveTextContent('broken!');
    });

    it('children 作为触发器渲染在添加区内', () => {
        renderUpload({}, { trigger: 'text' });
        expect(query(`.${prefix}-add`)).toHaveTextContent('上传文件');
    });
});

describe('Upload 根元素', () => {
    it('透传未声明的属性，aria-label 使根元素成为 group', () => {
        const view = renderUpload({ 'data-foo': 'bar' });
        expect(query(`.${prefix}`)).toHaveAttribute('data-foo', 'bar');
        expect(query(`.${prefix}`)).not.toHaveAttribute('role');
        view.update({ 'aria-label': '附件' });
        expect(query(`.${prefix}`)).toHaveAttribute('role', 'group');
    });

    it('aria-required、tabindex 不落在根元素上', () => {
        renderUpload({ 'aria-required': true, tabindex: 3 }, { trigger: 'text' });
        expect(query(`.${prefix}`)).not.toHaveAttribute('aria-required');
        expect(query(`.${prefix}`)).not.toHaveAttribute('tabindex');
        expect(query(`.${prefix}-add`)).toHaveAttribute('tabindex', '3');
    });

    it('焦点在内部控件之间移动时不触发 onblur，离开整个组件才触发', async () => {
        const onblur = fn();
        renderUpload({ fileList: defaultFileList, onblur });
        const first = query<HTMLElement>(`.${prefix}-add`);
        const close = query<HTMLElement>(`.${prefix}-file-card-close`);
        first.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: close }));
        expect(onblur).not.toHaveBeenCalled();
        first.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
        expect(onblur).toHaveBeenCalledTimes(1);
    });

    it('卸载后不再上报请求结果', async () => {
        const onSuccess = fn();
        const onChange = fn();
        const view = renderUpload({ onSuccess, onChange });
        await selectFiles([createFile(10, 'late.png')]);
        onChange.mockClear();
        view.unmount();
        await requests[0].respond(200, '{}');
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
    });
});
