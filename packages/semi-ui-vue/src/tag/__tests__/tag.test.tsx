/** @jsxImportSource vue */
import { fireEvent } from '@testing-library/vue';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { render } from '@test/utils/vue';
import { semiGlobalKey, SemiGlobal } from '../../_utils/semi-global';
import TagGroup from '../group.vue';
import type { TagCloseEvent, TagEmits, TagGroupEmits, TagGroupItem, TagGroupProps } from '../interface';
import SplitTagGroup from '../split-tag-group.vue';
import Tag from '../tag.vue';
import Model from './fixtures/model.vue';
import Split from './fixtures/split.vue';

const prefix = 'semi-tag';

describe('Tag', () => {
    it('v-model:visible 接收关闭操作', async () => {
        const view = render(Model);
        await fireEvent.keyDown(view.getByRole('button'), { key: 'Delete' });
        expect(view.getByRole('button')).toHaveClass(`${prefix}-invisible`);
        expect(view.container.querySelector('[data-visible]')).toHaveTextContent('false');
    });
    it('关闭非受控标签，发出原生事件与 tagKey', async () => {
        const close = vi.fn<(event: TagCloseEvent, tagKey?: string | number) => void>();
        const view = render(Tag, {
            props: { closable: true, tagKey: 'k', onClose: close },
            slots: { default: () => 'semi' },
        });
        await fireEvent.click(view.container.querySelector(`.${prefix}-close`) as HTMLElement);
        expect(close).toHaveBeenCalledWith(expect.any(MouseEvent), 'k');
        expect(view.emitted()['update:visible']).toEqual([[false]]);
        expect(view.getByRole('button')).toHaveClass(`${prefix}-invisible`);
    });
    it('close 的 preventDefault 阻止隐藏与更新事件', async () => {
        const view = render(Tag, {
            props: { closable: true, onClose: (event: TagCloseEvent) => event.preventDefault() },
            slots: { default: () => 'semi' },
        });
        await fireEvent.click(view.container.querySelector(`.${prefix}-close`) as HTMLElement);
        expect(view.getByRole('button')).not.toHaveClass(`${prefix}-invisible`);
        expect(view.emitted()['update:visible']).toBeUndefined();
    });
    it('受控 visible 只通知，父级同值渲染保持可见', async () => {
        const view = render(Tag, { props: { visible: true, closable: true }, slots: { default: () => 'semi' } });
        await fireEvent.keyDown(view.getByRole('button'), { key: 'Delete' });
        expect(view.getByRole('button')).not.toHaveClass(`${prefix}-invisible`);
        expect(view.emitted()['update:visible']).toEqual([[false]]);
        await view.rerender({ visible: true });
        expect(view.getByRole('button')).not.toHaveClass(`${prefix}-invisible`);
        await view.rerender({ visible: false });
        expect(view.getByRole('button')).toHaveClass(`${prefix}-invisible`);
    });
    it('显式 undefined 与受控转非受控都可以关闭', async () => {
        const view = render(Tag, { props: { visible: undefined, closable: true }, slots: { default: () => 'semi' } });
        await fireEvent.keyDown(view.getByRole('button'), { key: 'Delete' });
        expect(view.getByRole('button')).toHaveClass(`${prefix}-invisible`);
        await view.rerender({ visible: true });
        await view.rerender({ visible: undefined });
        expect(view.getByRole('button')).not.toHaveClass(`${prefix}-invisible`);
        await fireEvent.keyDown(view.getByRole('button'), { key: 'Backspace' });
        expect(view.getByRole('button')).toHaveClass(`${prefix}-invisible`);
    });
    it('静态标签不进入 Tab 顺序且没有角色与可访问名称', () => {
        const view = render(Tag, { slots: { default: () => 'semi' } });
        const root = view.container.firstElementChild as HTMLElement;
        expect(root).not.toHaveAttribute('role');
        expect(root).not.toHaveAttribute('tabindex');
        expect(root).not.toHaveAttribute('aria-label');
    });
    it.each(['Enter', ' '])('%s 激活 click 并阻止浏览器默认操作', async (key) => {
        const click = vi.fn<(event: MouseEvent) => void>();
        const view = render(Tag, { attrs: { onClick: click }, slots: { default: () => 'semi' } });
        expect(view.getByRole('button')).toHaveAttribute('tabindex', '0');
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        await fireEvent(view.getByRole('button'), event);
        expect(event.defaultPrevented).toBe(true);
        expect(click).toHaveBeenCalledTimes(1);
    });
    it('@click.once（onClickOnce）同样让标签成为可聚焦的 button', () => {
        const view = render(Tag, { attrs: { onClickOnce: vi.fn<(event: MouseEvent) => void>() }, slots: { default: () => 'semi' } });
        expect(view.getByRole('button')).toHaveAttribute('tabindex', '0');
    });
    it.each(['Backspace', 'Delete'])('%s 关闭后仍通知 keydown，关闭图标不冒泡 click', async (key) => {
        const keydown = vi.fn<(event: KeyboardEvent) => void>();
        const click = vi.fn<(event: MouseEvent) => void>();
        const view = render(Tag, {
            props: { closable: true, onKeydown: keydown },
            attrs: { onClick: click },
            slots: { default: () => 'semi' },
        });
        await fireEvent.keyDown(view.getByRole('button'), { key });
        expect(keydown).toHaveBeenCalledTimes(1);
        expect(view.getByRole('button')).toHaveClass(`${prefix}-invisible`);
        await fireEvent.click(view.container.querySelector(`.${prefix}-close`) as HTMLElement);
        expect(click).not.toHaveBeenCalled();
        expectTypeOf<TagEmits['close'][0]>().toEqualTypeOf<MouseEvent | KeyboardEvent>();
        expectTypeOf<TagGroupEmits['tagClose'][0]>().toEqualTypeOf<MouseEvent | KeyboardEvent>();
    });
    it('字符串内容生成语言包名称，使用方名称和 tabindex 优先', async () => {
        const view = render(Tag, { props: { closable: true, tabindex: -1 }, slots: { default: () => 'semi' } });
        expect(view.getByRole('button')).toHaveAttribute('aria-label', zh_CN.Tag.closableTag.replace('${tag}', 'semi'));
        expect(view.getByRole('button')).toHaveAttribute('tabindex', '-1');
        await view.rerender({ 'aria-label': 'custom' });
        expect(view.getByRole('button')).toHaveAttribute('aria-label', 'custom');
    });
    it('文本里的 $&、$$ 按原文写入 aria-label，不当作替换模式', () => {
        const view = render(Tag, { props: { closable: true }, slots: { default: () => '$&-$$' } });
        expect(view.getByRole('button')).toHaveAttribute('aria-label', zh_CN.Tag.closableTag.split('${tag}').join('$&-$$'));
    });
    it('非字符串内容不生成空名称，并渲染图标插槽', () => {
        const view = render(Tag, {
            props: { closable: true },
            slots: {
                default: () => <span>semi</span>,
                prefixIcon: () => <b>prefix</b>,
                suffixIcon: () => <b>suffix</b>,
            },
        });
        expect(view.getByRole('button')).not.toHaveAttribute('aria-label');
        expect(view.container.querySelector('[x-semi-prop="prefixIcon"]')).toHaveTextContent('prefix');
        expect(view.container.querySelector('[x-semi-prop="suffixIcon"]')).toHaveTextContent('suffix');
        expect(view.container.querySelector(`.${prefix}-content`)).toHaveClass(`${prefix}-content-center`);
    });
    it('读取 app 独立全局默认值并透传原生属性', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Tag: { color: 'red', size: 'large', closable: true } };
        const view = render(Tag, {
            attrs: { id: 'tag-id', 'data-check': 'tag', class: 'custom' },
            global: { provide: { [semiGlobalKey]: semi } },
            slots: { default: () => 'semi' },
        });
        expect(view.getByRole('button')).toHaveClass(`${prefix}-red-light`, `${prefix}-large`, 'custom');
        expect(view.getByRole('button')).toHaveAttribute('id', 'tag-id');
        expect(view.getByRole('button')).toHaveAttribute('data-check', 'tag');
    });
    it('头像图片是装饰性内容', () => {
        const view = render(Tag, {
            props: { avatarSrc: 'avatar.png', avatarShape: 'circle' },
            slots: { default: () => 'semi' },
        });
        expect(view.container.querySelector('img')).toHaveAttribute('alt', '');
        expect(view.container.firstElementChild).toHaveClass(`${prefix}-avatar-circle`);
    });
    it('尺寸、形状、类型与配色属性控制类名', () => {
        const view = render(Tag, {
            props: {
                size: 'small',
                shape: 'circle',
                type: 'solid',
                color: 'blue',
                colorful: true,
                gradient: true,
                visible: false,
            },
            slots: { default: () => 'semi' },
        });
        expect(view.container.firstElementChild).toHaveClass(`${prefix}-small`, `${prefix}-circle`, `${prefix}-solid`, `${prefix}-blue-solid`, `${prefix}-colorful`, `${prefix}-gradient`, `${prefix}-invisible`);
    });
});

describe('TagGroup', () => {
    it('相同文字标签关闭后不影响第二个，并传递 tagClose', async () => {
        const view = render(TagGroup, {
            props: {
                tagList: [
                    { children: '待办', closable: true },
                    { children: '待办', closable: true },
                ],
            },
        });
        await fireEvent.click(view.container.querySelector(`.${prefix}-close`) as HTMLElement);
        const tags = view.container.querySelectorAll(`.${prefix}`);
        expect(tags[0]).toHaveClass(`${prefix}-invisible`);
        expect(tags[1]).not.toHaveClass(`${prefix}-invisible`);
        expect(view.emitted().tagClose).toEqual([[expect.any(MouseEvent), '待办']]);
        expect(tags[0]).not.toHaveAttribute('children');
    });
    it('没有 tagKey 时移除已关闭的标签，后一个标签不继承其隐藏状态', async () => {
        const tagList = ['A', 'B', 'C'].map((children) => ({ children, closable: true }));
        const view = render(TagGroup, { props: { tagList } });
        await fireEvent.click(view.container.querySelectorAll(`.${prefix}-close`)[1] as HTMLElement);
        await view.rerender({ tagList: tagList.filter((tag) => tag.children !== 'B') });
        const tags = [...view.container.querySelectorAll(`.${prefix}`)];
        expect(tags.map((tag) => tag.textContent)).toEqual(['A', 'C']);
        tags.forEach((tag) => expect(tag).not.toHaveClass(`${prefix}-invisible`));
    });
    it('无 key 的标签跨引用变化保持挂载', async () => {
        const tagList = [{ children: 'a' }, { children: 'b' }];
        const view = render(TagGroup, { props: { tagList } });
        const before = [...view.container.querySelectorAll(`.${prefix}`)];
        await view.rerender({ tagList: [...tagList] });
        expect([...view.container.querySelectorAll(`.${prefix}`)]).toEqual(before);
        expectTypeOf<{ size: 'small' }>().not.toExtend<TagGroupProps>();
    });
    it('不会修改共享 tagList，组级样式各自生效', () => {
        const tagList: TagGroupItem[] = [{ children: 'a', color: 'white', avatarSrc: 'avatar.png' }, { children: 'b' }];
        const snapshot = tagList.map((tag) => ({ ...tag }));
        render(TagGroup, { props: { tagList, size: 'small' } });
        const large = render(TagGroup, { props: { tagList, size: 'large', avatarShape: 'circle' } });
        expect(tagList).toEqual(snapshot);
        expect(large.container.querySelector(`.${prefix}`)).toHaveClass(`${prefix}-large`, `${prefix}-avatar-circle`);
    });
    it('最大数量与自定义 restCount 控制 +N，通知鼠标进入', async () => {
        const view = render(TagGroup, {
            props: { tagList: [{ children: 'a' }, { children: 'b' }], maxTagCount: 1, restCount: 5 },
        });
        expect(view.queryByText('b')).toBeNull();
        await fireEvent.mouseEnter(view.getByText('+5').parentElement as HTMLElement);
        expect(view.emitted().plusNMouseEnter).toHaveLength(1);
    });
    it('tag 作用域插槽接收原始数据与下标，直接渲染自定义标签', () => {
        const tagList = [{ children: 'a' }, { children: 'b' }];
        const view = render(TagGroup, {
            props: { tagList },
            slots: {
                tag: ({ tag, index }: { tag: TagGroupItem; index: number }) => <strong>{`${index}:${tag.children}`}</strong>,
            },
        });
        expect(view.container.querySelectorAll('strong')).toHaveLength(2);
        expect(view.getByText('1:b')).toBeInTheDocument();
        expect(view.container.querySelector(`.${prefix}`)).toBeNull();
    });
});

describe('SplitTagGroup', () => {
    it('保留默认插槽、子元素样式与原生属性', () => {
        const view = render(SplitTagGroup, {
            attrs: { class: 'custom', 'aria-label': '标签组', style: { marginTop: '10px' } },
            slots: {
                default: () => (
                    <>
                        <Tag class="a">{() => 'A'}</Tag>
                        <Tag class="b">{() => 'B'}</Tag>
                    </>
                ),
            },
        });
        expect(view.getByRole('group', { name: '标签组' })).toHaveClass(`${prefix}-split`, 'custom');
        expect(view.getByRole('group')).toHaveStyle({ marginTop: '10px' });
        expect(view.getByRole('group').children[0]).toHaveClass('a');
        expect(view.getByRole('group').children[1]).toHaveClass('b');
    });
    it('支持单个标签', () => {
        const view = render(SplitTagGroup, { slots: { default: () => <Tag>{() => 'Only'}</Tag> } });
        expect(view.getByRole('group').children).toHaveLength(1);
        expect(view.getByRole('group')).toHaveTextContent('Only');
    });
    it('支持三个标签并保持顺序', () => {
        const view = render(Split, { props: { count: 3 } });
        expect([...view.getByRole('group').children].map((child) => child.textContent)).toEqual(['1', '2', '3']);
    });
    it('嵌套标签保留在父标签内', () => {
        const view = render(SplitTagGroup, {
            slots: {
                default: () => (
                    <>
                        <Tag>{() => ['outer', <Tag>{() => 'nested'}</Tag>]}</Tag>
                        <Tag>{() => 'B'}</Tag>
                    </>
                ),
            },
        });
        expect(view.getByRole('group').children).toHaveLength(2);
        expect(view.getByRole('group').children[0]).toHaveTextContent('outernested');
    });
    it('子元素变化时同步渲染并保持已有节点', async () => {
        const view = render(Split);
        const first = view.getByRole('group').firstElementChild;
        await view.rerender({ count: 3 });
        expect(view.getByRole('group').children).toHaveLength(3);
        expect(view.getByRole('group').firstElementChild).toBe(first);
        expect(view.getByRole('group').lastElementChild).toHaveTextContent('3');
    });
    it('跳过空节点并保留文本', () => {
        const view = render(SplitTagGroup, {
            slots: { default: () => [null, <Tag>{() => 'A'}</Tag>, false, 'text', <Tag>{() => 'B'}</Tag>] },
        });
        expect(view.getByRole('group').children).toHaveLength(2);
        expect(view.getByRole('group')).toHaveTextContent('AtextB');
    });
    it('Fragment 中的标签直接进入容器', () => {
        const view = render(SplitTagGroup, {
            slots: {
                default: () => (
                    <>
                        <Tag>{() => 'A'}</Tag>
                        <Tag>{() => 'B'}</Tag>
                    </>
                ),
            },
        });
        expect(view.getByRole('group').children).toHaveLength(2);
    });
});
