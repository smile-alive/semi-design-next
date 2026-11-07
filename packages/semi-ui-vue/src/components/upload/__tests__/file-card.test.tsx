/** @jsxImportSource vue */
import userEvent from '@testing-library/user-event';
import { fireEvent, screen } from '@testing-library/vue';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { render } from '@test/utils/vue';
import FileCard from '../file-card.vue';
import type { FileItem, UploadFileItemSlotProps, UploadPicCloseSlotProps, UploadSlots } from '../interface';
import { prefix, query } from './helpers';

const listFile: FileItem = { uid: '1', name: 'test.jpg', size: '130KB', status: 'success' };
const pictureFile: FileItem = { ...listFile, url: 'https://example.com/image.jpg' };

function renderCard(props: Record<string, unknown>, slots: Record<string, unknown> = {}) {
    return render(FileCard, { props: props as never, slots: slots as never });
}
const list = (extra: Partial<FileItem> = {}) => ({ listType: 'list', file: { ...listFile, ...extra } });
const picture = (extra: Partial<FileItem> = {}) => ({ listType: 'picture', file: { ...pictureFile, ...extra } });
const getListCard = () => query(`.${prefix}-file-card`);
const getPicCard = () => query(`.${prefix}-picture-file-card`);

describe('FileCard', () => {
    it('以 list 类型渲染 file card', () => {
        renderCard(list());
        expect(getListCard()).toHaveAttribute('role', 'listitem');
        expect(getListCard()).toHaveTextContent('test.jpg');
        expect(getListCard()).toHaveTextContent('130KB');
    });

    it('list 缩略图为装饰性元素，因为文件名已显示在旁边', () => {
        renderCard(list({ preview: true }));
        expect(query('img', getListCard())).toHaveAttribute('alt', '');
    });

    it('以 picture 类型渲染 picture card', () => {
        renderCard(picture());
        expect(getPicCard()).not.toBeNull();
        expect(screen.getByAltText('test.jpg')).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it.each([
        ['list', list, getListCard],
        ['picture', picture, getPicCard],
    ] as const)('%s card 的 class、style、data-*、aria-* 落根元素，文件字段不落 DOM', (_, cardProps, getCard) => {
        renderCard({
            ...cardProps({ response: { ok: true }, fileInstance: new File(['a'], 'a.txt') }),
            class: 'own',
            style: { color: 'red' },
            'data-testid': 'card',
            'aria-label': 'file card',
        });
        const card = getCard();
        expect(card).toHaveClass('own');
        expect(card).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(card).toHaveAttribute('data-testid', 'card');
        expect(card).toHaveAttribute('aria-label', 'file card');
        expect(card.hasAttribute('response')).toBe(false);
        expect(card.hasAttribute('fileinstance')).toBe(false);
    });

    it('picWidth、picHeight 覆盖 style 中的宽高', () => {
        renderCard({ ...picture(), picWidth: 80, picHeight: '60px', style: { width: '10px', color: 'red' } });
        expect(getPicCard()).toHaveStyle({ width: '80px', height: '60px', color: 'rgb(255, 0, 0)' });
    });

    it('只传 picWidth 时保留 style 中的高度', () => {
        renderCard({ ...picture(), picWidth: 80, style: { height: '120px', width: '90px' } });
        expect(getPicCard()).toHaveStyle({ width: '80px', height: '120px' });
    });

    it('FileItem 拼错的字段会报类型错误，插槽参数都有声明', () => {
        expectTypeOf<FileItem>().not.toHaveProperty('urll');
        expectTypeOf<UploadFileItemSlotProps>().not.toHaveProperty('key');
        expectTypeOf<Parameters<NonNullable<UploadSlots['thumbnail']>>[0]>().toEqualTypeOf<UploadFileItemSlotProps>();
        expectTypeOf<Parameters<NonNullable<UploadSlots['picClose']>>[0]>().toEqualTypeOf<UploadPicCloseSlotProps>();
    });

    it('未知 listType 时不渲染', () => {
        const { container } = renderCard({ ...list(), listType: 'unknown' });
        expect(container.querySelector('div')).toBeNull();
    });

    it('点击关闭按钮时发出 remove，且不触发预览', async () => {
        const onRemove = vi.fn<() => void>();
        const onPreviewClick = vi.fn<() => void>();
        renderCard({ ...list(), onRemove, onPreviewClick });
        await userEvent.click(query(`.${prefix}-file-card-close`));
        expect(onRemove).toHaveBeenCalledTimes(1);
        expect(onPreviewClick).not.toHaveBeenCalled();
    });

    it('点击重试按钮时发出 retry', async () => {
        const onRetry = vi.fn<() => void>();
        renderCard({ ...list({ status: 'uploadFail' }), showRetry: true, onRetry });
        await userEvent.click(screen.getByRole('button', { name: '重试' }));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('picture card 点击关闭按钮时发出 remove', async () => {
        const onRemove = vi.fn<() => void>();
        renderCard({ ...picture(), onRemove });
        await userEvent.click(query(`.${prefix}-picture-file-card-close`));
        expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('picture card 点击重试按钮时发出 retry', async () => {
        const onRetry = vi.fn<() => void>();
        renderCard({ ...picture({ status: 'uploadFail' }), showRetry: true, onRetry });
        await userEvent.click(query(`.${prefix}-picture-file-card-retry`));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('#validateMessage 替换图标与文字', () => {
        renderCard({ ...list({ status: 'validateFail', validateMessage: 'plain' }) }, { validateMessage: () => <span class="custom-msg">Error</span> });
        const message = query(`.${prefix}-file-card-info-validate-message`);
        expect(query('.custom-msg', message)).toHaveTextContent('Error');
        expect(message.querySelector(`.${prefix}-file-card-icon-error`)).toBeNull();
        expect(message).not.toHaveTextContent('plain');
    });

    it('validateMessage prop 优先于文件项字段', () => {
        renderCard({ ...list({ status: 'validateFail', validateMessage: 'from file' }), validateMessage: 'from prop' });
        expect(getListCard()).toHaveTextContent('from prop');
        expect(getListCard()).not.toHaveTextContent('from file');
    });

    it('数值 size 的 file card', () => {
        renderCard({ listType: 'list', file: { ...listFile, size: 1024 } });
        expect(query(`.${prefix}-file-card-info-size`)).toHaveTextContent(/^1\.0KB$/);
    });

    it('带 style 的 file card', () => {
        renderCard({ ...list(), style: { width: '100%' } });
        expect(getListCard()).toHaveStyle({ width: '100%' });
    });

    it('带 #thumbnail 的 picture card', () => {
        renderCard(
            { ...picture(), picWidth: 100, picHeight: 100 },
            {
                thumbnail: ({ file }: UploadFileItemSlotProps) => <img class="custom-thumbnail" alt={file.name} src={file.url} />,
            }
        );
        expect(screen.getByAltText('test.jpg')).toHaveClass('custom-thumbnail');
        expect(getPicCard()).toHaveClass(`${prefix}-picture-file-card-custom-thumbnail`);
    });

    it('带 #picClose 的 picture card', () => {
        renderCard(picture(), {
            picClose: ({ class: cls, onRemove }: UploadPicCloseSlotProps) => (
                <button type="button" class={cls} onClick={onRemove}>
                    X
                </button>
            ),
        });
        const close = query(`.${prefix}-picture-file-card-close`);
        expect(close.tagName).toEqual('BUTTON');
        expect(close).toHaveTextContent('X');
    });

    it('disabled 的 file card 隐藏删除按钮', () => {
        renderCard({ ...list(), disabled: true });
        expect(getListCard()).toHaveTextContent('test.jpg');
        expect(document.querySelector(`.${prefix}-file-card-close`)).toBeNull();
    });

    it('disabled 的 file card 仍渲染 #fileOperation', () => {
        renderCard({ ...list(), disabled: true }, { fileOperation: () => <span class="op">op</span> });
        expect(document.querySelector('.op')).not.toBeNull();
    });

    it('disabled 的 picture card', () => {
        renderCard({ ...picture(), disabled: true });
        expect(getPicCard()).toHaveClass(`${prefix}-picture-file-card-disabled`);
        expect(document.querySelector(`.${prefix}-picture-file-card-close`)).toBeNull();
    });

    it('validating 状态且带 validateMessage 的 picture card', async () => {
        renderCard(picture({ status: 'validating', validateMessage: 'Validating...' }));
        const loading = query(`.${prefix}-picture-file-card-icon-loading`);
        await userEvent.hover(loading);
        expect(await screen.findByText('Validating...')).toBeInTheDocument();
    });

    it('validateFail 状态且带 validateMessage 的 picture card', () => {
        renderCard(picture({ status: 'validateFail', validateMessage: 'Validation failed' }));
        expect(document.querySelector(`.${prefix}-picture-file-card-icon-error`)).not.toBeNull();
        expect(getPicCard()).not.toHaveClass(`${prefix}-picture-file-card-error`);
    });

    it.each(['validating', 'validateFail'] as const)('%s 状态的 picture card 在 #validateMessage 对该文件为空时不显示图标', (status) => {
        renderCard(picture({ status }), { validateMessage: () => [] });
        expect(document.querySelector(`.${prefix}-picture-file-card-icon-loading`)).toBeNull();
        expect(document.querySelector(`.${prefix}-picture-file-card-icon-error`)).toBeNull();
    });

    it.each([
        ['validating', 'loading'],
        ['validateFail', 'error'],
    ] as const)('%s 状态的 picture card 只有 #validateMessage 内容、没有字符串时显示 %s 图标', (status, icon) => {
        renderCard(picture({ status }), { validateMessage: () => <span>x</span> });
        expect(document.querySelector(`.${prefix}-picture-file-card-icon-${icon}`)).not.toBeNull();
    });

    it('uploadFail 状态且带 validateMessage 的 picture card', () => {
        renderCard(picture({ status: 'uploadFail', validateMessage: 'Upload failed' }));
        expect(document.querySelector(`.${prefix}-picture-file-card-icon-error`)).not.toBeNull();
        expect(getPicCard()).toHaveClass(`${prefix}-picture-file-card-error`);
    });

    it('uploading 状态的 picture card', () => {
        renderCard(picture({ status: 'uploading', percent: 50 }));
        expect(getPicCard()).toHaveClass(`${prefix}-picture-file-card-uploading`);
        expect(screen.getByRole('progressbar', { name: zh_CN.Upload.uploadProgress })).toHaveAttribute('aria-valuenow', '50');
    });

    it('带兜底预览的 picture card', async () => {
        renderCard(picture());
        await fireEvent.error(screen.getByAltText('test.jpg'));
        expect(getPicCard()).toHaveClass(`${prefix}-picture-file-card-preview-fallback`);
        expect(screen.queryByAltText('test.jpg')).toBeNull();
        expect(getPicCard().querySelector('.semi-icon-file')).not.toBeNull();
    });

    it.each([
        ['list', list, getListCard],
        ['picture', picture, getPicCard],
    ] as const)('%s card 的缩略图加载失败后，url 更新时恢复显示图片', async (_, cardProps, getCard) => {
        const first = 'https://example.com/first.jpg';
        const second = 'https://example.com/second.jpg';
        const view = renderCard(cardProps({ preview: true, url: first }));
        await fireEvent.error(query('img', getCard()));
        expect(getCard().querySelector('img')).toBeNull();
        await view.rerender(cardProps({ preview: true, url: second }));
        expect(query('img', getCard())).toHaveAttribute('src', second);
    });

    it('带 preview 与 url 的 file card', () => {
        renderCard(list({ preview: true, url: 'https://example.com/image.jpg' }));
        expect(query('img', getListCard())).toHaveAttribute('src', 'https://example.com/image.jpg');
        expect(query(`.${prefix}-file-card-preview`)).not.toHaveClass(`${prefix}-file-card-preview-placeholder`);
    });

    it('带 preview 但无 url 的 file card', () => {
        renderCard(list({ preview: true }));
        expect(query('img', getListCard())).not.toHaveAttribute('src');
    });

    it('#picClose 的 onRemove 发出 remove', async () => {
        const onRemove = vi.fn<() => void>();
        renderCard(
            { ...picture(), onRemove },
            {
                picClose: ({ class: cls, onRemove: remove }: UploadPicCloseSlotProps) => (
                    <button type="button" class={cls} onClick={remove}>
                        Custom Close
                    </button>
                ),
            }
        );
        await userEvent.click(screen.getByText('Custom Close'));
        expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('未监听 remove、retry 时点击不报错', async () => {
        render(FileCard, { props: { file: { ...listFile, status: 'uploadFail' }, showRetry: true } });
        await userEvent.click(screen.getByRole('button', { name: '重试' }));
        await userEvent.click(query(`.${prefix}-file-card-close`));
        expect(getListCard()).toHaveTextContent('test.jpg');
    });

    it('list 卡片的替换按钮本身是 Tooltip 触发器，点击发出 replace', async () => {
        const onReplace = vi.fn<() => void>();
        const onPreviewClick = vi.fn<() => void>();
        renderCard({ ...list(), showReplace: true, onReplace, onPreviewClick });
        const replace = query(`button.${prefix}-file-card-replace`);
        expect(replace).toHaveAccessibleName('替换文件');
        await userEvent.hover(replace);
        expect(await screen.findByText('替换文件', { selector: '.semi-tooltip-content, .semi-tooltip-content *' })).toBeInTheDocument();
        await userEvent.click(replace);
        expect(onReplace).toHaveBeenCalledTimes(1);
        expect(onPreviewClick).not.toHaveBeenCalled();
    });

    it('list 卡片的替换按钮外没有带 tabindex 的包装元素，Tab 只在替换按钮停一次', async () => {
        renderCard({ ...list(), showReplace: true });
        const replace = screen.getByRole('button', { name: '替换文件' });
        expect(replace.parentElement?.closest('[tabindex]')).toBeNull();
        await userEvent.tab();
        expect(replace).toHaveFocus();
        await userEvent.tab();
        expect(screen.getByRole('button', { name: '移除文件' })).toHaveFocus();
    });

    it('文件项的 showRetry、showReplace 优先于卡片配置', () => {
        renderCard({ ...list({ showReplace: true }), showReplace: false });
        expect(document.querySelector(`button.${prefix}-file-card-replace`)).not.toBeNull();
    });

    it.each([
        ['retry', '重试', { status: 'uploadFail' }, { showRetry: true }, 'onRetry'],
        ['replace', '替换文件', {}, { showReplace: true }, 'onReplace'],
        ['remove', '移除文件', {}, {}, 'onRemove'],
    ] as const)('picture card 的 %s 控件为原生按钮，Enter 可激活', async (_, name, fileExtra, extra, handler) => {
        const callback = vi.fn<() => void>();
        renderCard({ ...picture(fileExtra), ...extra, [handler]: callback });
        const button = screen.getByRole('button', { name });
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
        button.focus();
        await userEvent.keyboard('{Enter}');
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('list card 的重试控件为原生按钮，Enter 可激活', async () => {
        const onRetry = vi.fn<() => void>();
        renderCard({ ...list({ status: 'uploadFail' }), showRetry: true, onRetry });
        const button = screen.getByRole('button', { name: '重试' });
        expect(button.tagName).toBe('BUTTON');
        button.focus();
        await userEvent.keyboard('{Enter}');
        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['picture', picture],
        ['list', list],
    ] as const)('%s card 可通过键盘在带名称的按钮上打开预览', async (_, cardProps) => {
        const onPreviewClick = vi.fn<() => void>();
        renderCard({ ...cardProps(), onPreviewClick });
        screen.getByRole('button', { name: '预览' }).focus();
        await userEvent.keyboard('{Enter}');
        expect(onPreviewClick).toHaveBeenCalledTimes(1);
    });

    it('未传 onPreviewClick 的 card 没有预览按钮', () => {
        renderCard(picture());
        expect(screen.queryByRole('button', { name: '预览' })).toBeNull();
    });

    it('picture file card 的 showReplace 发出 replace', async () => {
        const onReplace = vi.fn<() => void>();
        const onPreviewClick = vi.fn<() => void>();
        renderCard({ ...picture(), showReplace: true, onReplace, onPreviewClick });
        await userEvent.click(query(`.${prefix}-picture-file-card-replace`));
        expect(onReplace).toHaveBeenCalledTimes(1);
        expect(onPreviewClick).not.toHaveBeenCalled();
    });
});
