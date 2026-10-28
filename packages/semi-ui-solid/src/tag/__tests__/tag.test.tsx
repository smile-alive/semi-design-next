import { createSignal, type JSX } from 'solid-js';
import { fireEvent, render, within } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import Tag, { SplitTagGroup, TagGroup } from '..';
import semiGlobal from '../../_utils/semi-global';
import type { SplitTagGroupProps, TagCloseEvent, TagGroupItem, TagGroupProps, TagProps } from '../interface';

const prefix = `${BASE_CLASS_PREFIX}-tag`;
const closeIcon = (container: HTMLElement) => container.querySelector(`.${prefix}-close`) as HTMLElement;
const tagNode = (container: HTMLElement) => container.querySelector(`.${prefix}`) as HTMLElement;
const tagNodes = (container: HTMLElement) => [...container.querySelectorAll<HTMLElement>(`.${prefix}`)];

afterEach(() => {
    semiGlobal.config.overrideDefaultProps = {};
});

describe('Tag', () => {
    it('可关闭的 Tag 关闭后隐藏自身', async () => {
        const onClose = vi.fn<NonNullable<TagProps['onClose']>>();
        const { container } = render(() => (
            <Tag closable tagKey="k" onClose={onClose}>
                semi
            </Tag>
        ));
        expect(tagNode(container)).not.toHaveClass(`${prefix}-invisible`);

        await userEvent.click(closeIcon(container));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onClose.mock.calls[0][0]).toBe('semi');
        expect(onClose.mock.calls[0][2]).toBe('k');
        expect(tagNode(container)).toHaveClass(`${prefix}-invisible`);
    });

    it('onClose 中 preventDefault 后 Tag 保持可见', async () => {
        const { container } = render(() => (
            <Tag closable onClose={(_, e) => e.preventDefault()}>
                semi
            </Tag>
        ));
        await userEvent.click(closeIcon(container));
        expect(tagNode(container)).not.toHaveClass(`${prefix}-invisible`);
    });

    it('点击关闭图标不触发 onClick', async () => {
        const onClick = vi.fn<() => void>();
        const { container } = render(() => (
            <Tag closable onClick={onClick}>
                semi
            </Tag>
        ));
        await userEvent.click(closeIcon(container));
        expect(onClick).not.toHaveBeenCalled();
    });

    it('受控 visible 不会被关闭操作改变', async () => {
        const onClose = vi.fn<NonNullable<TagProps['onClose']>>();
        const [visible, setVisible] = createSignal<boolean | undefined>(true);
        const { container } = render(() => (
            <Tag closable visible={visible()} onClose={onClose}>
                semi
            </Tag>
        ));
        await userEvent.click(closeIcon(container));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(tagNode(container)).not.toHaveClass(`${prefix}-invisible`);

        setVisible(false);
        expect(tagNode(container)).toHaveClass(`${prefix}-invisible`);
    });

    it('visible 转为 undefined 后，由内部状态决定', async () => {
        const [visible, setVisible] = createSignal<boolean | undefined>(true);
        const { container } = render(() => (
            <Tag closable visible={visible()}>
                semi
            </Tag>
        ));
        setVisible(undefined);
        expect(tagNode(container)).not.toHaveClass(`${prefix}-invisible`);
        await userEvent.click(closeIcon(container));
        expect(tagNode(container)).toHaveClass(`${prefix}-invisible`);
    });

    it('带 onClick 或可关闭的 Tag 是可聚焦按钮，Enter 触发 onClick', () => {
        const onClick = vi.fn<(event: MouseEvent) => void>();
        const [clickable, setClickable] = createSignal(false);
        const [closable, setClosable] = createSignal(false);
        const { container } = render(() => (
            <Tag onClick={clickable() ? onClick : undefined} closable={closable()}>
                plain
            </Tag>
        ));
        expect(tagNode(container)).not.toHaveAttribute('role');
        expect(tagNode(container)).not.toHaveAttribute('tabindex');

        setClickable(true);
        expect(tagNode(container)).toHaveAttribute('role', 'button');
        expect(tagNode(container)).toHaveAttribute('tabindex', '0');
        fireEvent.keyDown(tagNode(container), { key: 'Enter' });
        expect(onClick).toHaveBeenCalledTimes(1);

        setClickable(false);
        setClosable(true);
        expect(tagNode(container)).toHaveAttribute('role', 'button');
    });

    it('Space 触发可点击 Tag 的 onClick，且不滚动页面', () => {
        const onClick = vi.fn<() => void>();
        const { container } = render(() => <Tag onClick={onClick}>click</Tag>);
        const notPrevented = fireEvent.keyDown(tagNode(container), { key: ' ' });
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(notPrevented).toBe(false);
    });

    it('不可交互的 Tag 按键不被拦截，onKeyDown 照常触发', () => {
        const onKeyDown = vi.fn<() => void>();
        const { container } = render(() => <Tag onKeyDown={onKeyDown}>plain</Tag>);
        expect(fireEvent.keyDown(tagNode(container), { key: 'Backspace' })).toBe(true);
        expect(onKeyDown).toHaveBeenCalledTimes(1);
    });

    it('Backspace 和 Delete 关闭可关闭的 Tag，并且仍会触发 onKeyDown', () => {
        const onClose = vi.fn<NonNullable<TagProps['onClose']>>();
        const onKeyDown = vi.fn<() => void>();
        const { container } = render(() => (
            <Tag closable tagKey="k" onClose={onClose} onKeyDown={onKeyDown}>
                semi
            </Tag>
        ));
        fireEvent.keyDown(tagNode(container), { key: 'Backspace' });
        expect(onClose).toHaveBeenCalledWith('semi', expect.objectContaining({ type: 'keydown' }), 'k');
        expectTypeOf<Parameters<NonNullable<TagProps['onClose']>>[1]>().toEqualTypeOf<TagCloseEvent>();
        expectTypeOf<Parameters<NonNullable<TagGroupProps['onTagClose']>>[1]>().toEqualTypeOf<TagCloseEvent>();
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(tagNode(container)).toHaveClass(`${prefix}-invisible`);
    });

    it('字符串子节点自动生成 aria-label，用户传入的值优先', () => {
        const [label, setLabel] = createSignal<string>();
        const { container } = render(() => (
            <Tag closable aria-label={label()}>
                semi
            </Tag>
        ));
        expect(tagNode(container)).toHaveAttribute('aria-label', zh_CN.Tag.closableTag.replace('${tag}', 'semi'));
        setLabel('custom');
        expect(tagNode(container)).toHaveAttribute('aria-label', 'custom');
    });

    it('文本里的 $&、$$ 按原文写入 aria-label，不当作替换模式', () => {
        const { container } = render(() => <Tag closable>$&-$$</Tag>);
        expect(tagNode(container)).toHaveAttribute('aria-label', zh_CN.Tag.closableTag.split('${tag}').join('$&-$$'));
    });

    it('多段文本与数字子节点与单个字符串一样生成 aria-label 并可省略', () => {
        const count = 3;
        const { container } = render(() => (
            <>
                <Tag closable>{count} items</Tag>
                <Tag onClick={() => {}}>{5}</Tag>
            </>
        ));
        const [first, second] = tagNodes(container);
        expect(first).toHaveAttribute('aria-label', zh_CN.Tag.closableTag.replace('${tag}', '3 items'));
        expect(first.querySelector(`.${prefix}-content-ellipsis`)).not.toBeNull();
        expect(second).toHaveAttribute('aria-label', zh_CN.Tag.tag.replace('${tag}', '5'));
    });

    it('不可交互的 Tag 不写 aria-label，非字符串子节点的可交互 Tag 也没有空的 aria-label', () => {
        const { container } = render(() => (
            <>
                <Tag>semi</Tag>
                <Tag onClick={() => {}}>
                    <span>semi</span>
                </Tag>
                <Tag onClick={() => {}}>semi</Tag>
            </>
        ));
        const [plain, node, text] = tagNodes(container);
        expect(plain).not.toHaveAttribute('aria-label');
        expect(node).not.toHaveAttribute('aria-label');
        expect(node.querySelector(`.${prefix}-content-center`)).not.toBeNull();
        expect(text).toHaveAttribute('aria-label', zh_CN.Tag.tag.replace('${tag}', 'semi'));
    });

    it('不可交互的 Tag 保留使用方的 role 与 aria-label', () => {
        const { container } = render(() => (
            <Tag role="note" aria-label="custom">
                semi
            </Tag>
        ));
        expect(tagNode(container)).toHaveAttribute('role', 'note');
        expect(tagNode(container)).toHaveAttribute('aria-label', 'custom');
    });

    it('tabIndex 由使用方指定时保留，可交互 Tag 默认为 0', () => {
        const { container } = render(() => (
            <>
                <Tag tabIndex={-1} onClick={() => {}}>
                    a
                </Tag>
                <Tag tabIndex={0}>b</Tag>
            </>
        ));
        const [first, second] = tagNodes(container);
        expect(first).toHaveAttribute('tabindex', '-1');
        expect(second).toHaveAttribute('tabindex', '0');
    });

    it('前后缀图标与头像', () => {
        const { container } = render(() => (
            <Tag prefixIcon={<i data-testid="pre" />} suffixIcon={<i data-testid="suf" />} avatarSrc="avatar.png">
                Douyin
            </Tag>
        ));
        expect(container.querySelector(`.${prefix}-prefix-icon [data-testid="pre"]`)).not.toBeNull();
        expect(container.querySelector(`.${prefix}-suffix-icon [data-testid="suf"]`)).not.toBeNull();
        expect(tagNode(container)).toHaveClass(`${prefix}-avatar-square`);
        expect(container.querySelector('img')).toHaveAttribute('alt', '');
    });

    it('样式类：size、shape、type、color、colorful、gradient', () => {
        const { container } = render(() => (
            <Tag size="large" shape="circle" type="solid" color="red" colorful gradient class="mine">
                semi
            </Tag>
        ));
        expect(tagNode(container)).toHaveClass(`${prefix}-large`, `${prefix}-circle`, `${prefix}-solid`, `${prefix}-red-solid`, `${prefix}-colorful`, `${prefix}-gradient`, 'mine');
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Tag: { color: 'red', size: 'large' } };
        const [size, setSize] = createSignal<'small' | undefined>();
        const { container } = render(() => <Tag size={size()}>semi</Tag>);
        expect(tagNode(container)).toHaveClass(`${prefix}-large`, `${prefix}-red-light`);
        setSize('small');
        expect(tagNode(container)).toHaveClass(`${prefix}-small`);
    });

    it('ref 与未声明属性落在根元素', () => {
        let ref: HTMLDivElement | undefined;
        const { container } = render(() => (
            <Tag ref={(node) => (ref = node)} data-foo="bar">
                semi
            </Tag>
        ));
        expect(ref).toBe(tagNode(container));
        expect(tagNode(container)).toHaveAttribute('data-foo', 'bar');
    });
});

describe('TagGroup', () => {
    it('渲染标签并向每个标签下发 size、avatarShape，不改写共享的 tagList', () => {
        const tagList = ['Douyin', 'Hotsoon', 'Capcut', 'Xingtu'].map((children): TagGroupItem => ({ color: 'white', children, avatarSrc: 'avatar.png' }));
        const snapshot = tagList.map((tag) => ({ ...tag }));
        const { container } = render(() => (
            <>
                <TagGroup class="small-group" maxTagCount={3} size="small" tagList={tagList} />
                <TagGroup class="large-group" avatarShape="circle" maxTagCount={2} size="large" tagList={tagList} />
            </>
        ));
        expect(tagList).toEqual(snapshot);
        const avatarTags = (group: string) => tagNodes(container).filter((tag) => tag.closest(`.${group}`) && tag.querySelector('img'));
        const largeTags = avatarTags('large-group');
        expect(largeTags).toHaveLength(2);
        largeTags.forEach((tag) => expect(tag).toHaveClass(`${prefix}-large`, `${prefix}-avatar-circle`));
        const smallTags = avatarTags('small-group');
        expect(smallTags).toHaveLength(3);
        smallTags.forEach((tag) => expect(tag).toHaveClass(`${prefix}-small`, `${prefix}-avatar-square`));
    });

    it('maxTagCount 时折叠多余的标签并显示 +N，restCount 优先', () => {
        const tagList = ['a', 'b', 'c', 'd'].map((children): TagGroupItem => ({ children }));
        const { container } = render(() => (
            <>
                <TagGroup class="plain" maxTagCount={2} tagList={tagList} />
                <TagGroup class="rest" maxTagCount={2} restCount={9} tagList={tagList} />
                <TagGroup class="all" maxTagCount={4} tagList={tagList} />
            </>
        ));
        const texts = (group: string) =>
            tagNodes(container)
                .filter((tag) => tag.closest(`.${group}`))
                .map((tag) => tag.textContent);
        expect(texts('plain')).toEqual(['a', 'b', '+2']);
        expect(texts('rest')).toEqual(['a', 'b', '+9']);
        expect(texts('all')).toEqual(['a', 'b', 'c', 'd']);
        expect(container.querySelector('.plain')).toHaveClass(`${prefix}-group-max`);
    });

    it('悬停 +N 触发 onPlusNMouseEnter', async () => {
        const onEnter = vi.fn<() => void>();
        const { container } = render(() => <TagGroup maxTagCount={1} onPlusNMouseEnter={onEnter} tagList={[{ children: 'a' }, { children: 'b' }]} />);
        await userEvent.hover(tagNodes(container)[1]);
        expect(onEnter).toHaveBeenCalledTimes(1);
    });

    it('onTagClose 与标签自己的 onClose 都会触发', async () => {
        const own = vi.fn<NonNullable<TagProps['onClose']>>();
        const onTagClose = vi.fn<NonNullable<TagGroupProps['onTagClose']>>();
        const { container } = render(() => <TagGroup onTagClose={onTagClose} tagList={[{ children: 'a', closable: true, onClose: own }]} />);
        await userEvent.click(closeIcon(container));
        expect(own).toHaveBeenCalledTimes(1);
        expect(onTagClose).toHaveBeenCalledTimes(1);
        expect(onTagClose.mock.calls[0][0]).toBe('a');
        expect(onTagClose.mock.calls[0][2]).toBe('a');
    });

    it('没有 tagKey 的标签，tagKey 回落为文本或下标', async () => {
        const onTagClose = vi.fn<NonNullable<TagGroupProps['onTagClose']>>();
        const { container } = render(() => <TagGroup onTagClose={onTagClose} tagList={[{ closable: true }, { children: 'text', closable: true }]} />);
        await userEvent.click(container.querySelectorAll<HTMLElement>(`.${prefix}-close`)[0]);
        await userEvent.click(container.querySelectorAll<HTMLElement>(`.${prefix}-close`)[1]);
        expect(onTagClose.mock.calls.map((call) => call[2])).toEqual([0, 'text']);
    });

    it('文字相同的标签关闭第一个后，第二个仍然显示', async () => {
        const { container } = render(() => (
            <TagGroup
                tagList={[
                    { children: '待办', closable: true },
                    { children: '待办', closable: true },
                ]}
            />
        ));
        await userEvent.click(container.querySelectorAll<HTMLElement>(`.${prefix}-close`)[0]);
        expect(tagNodes(container).map((tag) => tag.classList.contains(`${prefix}-invisible`))).toEqual([true, false]);
    });

    it('没有 tagKey 时，在关闭回调里移除标签，后一个标签不继承已关闭标签的隐藏状态', async () => {
        const [list, setList] = createSignal(['A', 'B', 'C']);
        const { container } = render(() => <TagGroup tagList={list().map((children) => ({ children, closable: true }))} onTagClose={(children) => setList((prev) => prev.filter((item) => item !== children))} />);
        await userEvent.click(container.querySelectorAll<HTMLElement>(`.${prefix}-close`)[1]);
        const tags = tagNodes(container);
        expect(tags.map((tag) => tag.textContent)).toEqual(['A', 'C']);
        tags.forEach((tag) => expect(tag).not.toHaveClass(`${prefix}-invisible`));
    });

    it('tagList 重新创建后，已存在的标签保持挂载并保留隐藏状态', async () => {
        const [version, setVersion] = createSignal(0);
        const { container } = render(() => <TagGroup tagList={['A', 'B'].map((children) => ({ children, closable: true, class: `v${version()}` }))} />);
        const before = tagNodes(container);
        await userEvent.click(before[0].querySelector<HTMLElement>(`.${prefix}-close`) as HTMLElement);
        setVersion(1);
        const after = tagNodes(container);
        after.forEach((tag, index) => expect(tag).toBe(before[index]));
        expect(after[0]).toHaveClass(`${prefix}-invisible`, 'v1');
    });

    it('没有 tagKey 与文本的标签在多次渲染间保持挂载', () => {
        const [list, setList] = createSignal<TagGroupItem[]>([{ avatarSrc: 'a.png' }, { avatarSrc: 'b.png' }]);
        const { container } = render(() => <TagGroup tagList={list()} />);
        const before = tagNodes(container);
        setList((prev) => [...prev]);
        tagNodes(container).forEach((tag, index) => expect(tag).toBe(before[index]));
    });

    it('renderTag 以每一项和它的序号渲染，取代默认的 Tag', () => {
        const { container } = render(() => <TagGroup maxTagCount={1} tagList={[{ children: 'x' }, { children: 'y' }]} renderTag={(tag, index) => <span>{`${tag.children}${index}`}</span>} />);
        expect(container.textContent).toBe('x0+1');
    });

    it('renderTag 只为显示的项调用，maxTagCount 放开后已显示的项保持挂载', () => {
        const rendered: unknown[] = [];
        const [max, setMax] = createSignal<number | undefined>(1);
        const { container } = render(() => (
            <TagGroup
                maxTagCount={max()}
                tagList={[{ children: 'x' }, { children: 'y' }]}
                renderTag={(tag) => {
                    rendered.push(tag.children);
                    return <span>{tag.children}</span>;
                }}
            />
        ));
        expect(rendered).toEqual(['x']);
        const first = container.querySelector('span');
        setMax(undefined);
        expect(container.textContent).toBe('xy');
        expect(container.querySelector('span')).toBe(first);
        expect(rendered).toEqual(['x', 'y']);
    });

    it('Props 类型：tagList 必填且只放数据，声明了 ref', () => {
        expectTypeOf<{ tagList: TagGroupItem[] }>().toExtend<TagGroupProps>();
        expectTypeOf<{ tagList: TagGroupItem[]; renderTag: (tag: TagGroupItem, index: number) => JSX.Element }>().toExtend<TagGroupProps>();
        expectTypeOf<{ tagList: JSX.Element[] }>().not.toExtend<TagGroupProps>();
        expectTypeOf<{ tagList: { children: JSX.Element }[] }>().not.toExtend<TagGroupProps>();
        expectTypeOf<{ tagList: { prefixIcon: JSX.Element }[] }>().not.toExtend<TagGroupProps>();
        expectTypeOf<{ tagList: string[] }>().not.toExtend<TagGroupProps>();
        expectTypeOf<{ size: 'small' }>().not.toExtend<TagGroupProps>();
        expectTypeOf<{ tagList: TagGroupItem[]; ref: (node: HTMLDivElement) => void }>().toExtend<TagGroupProps>();
        expectTypeOf<{ ref: (node: HTMLDivElement) => void }>().toExtend<SplitTagGroupProps>();
    });

    it('读取 semiGlobal 默认值，ref 与未声明属性落在根元素', () => {
        semiGlobal.config.overrideDefaultProps = { TagGroup: { size: 'large' } };
        let ref: HTMLDivElement | undefined;
        const { container } = render(() => <TagGroup ref={(node) => (ref = node)} data-foo="bar" tagList={[{ children: 'a' }]} />);
        const group = container.querySelector(`.${prefix}-group`);
        expect(ref).toBe(group);
        expect(group).toHaveAttribute('data-foo', 'bar');
        expect(group).toHaveClass(`${prefix}-group-large`);
        expect(tagNode(container)).toHaveClass(`${prefix}-large`);
    });
});

describe('SplitTagGroup', () => {
    it('渲染 group 并透传原生属性', () => {
        const { container } = render(() => (
            <SplitTagGroup class="custom" style={{ 'margin-top': '10px' }} aria-label="标签组">
                <Tag>A</Tag>
                <Tag>B</Tag>
            </SplitTagGroup>
        ));
        const group = within(container).getByRole('group', { name: '标签组' });
        expect(group).toHaveClass(`${prefix}-split`, 'custom');
        expect(group).toHaveStyle({ marginTop: '10px' });
        expect(group.children).toHaveLength(2);
    });

    it('保留子元素已有 class 与顺序', () => {
        const { container } = render(() => (
            <SplitTagGroup>
                <Tag class="first">A</Tag>
                <Tag class="last">B</Tag>
            </SplitTagGroup>
        ));
        const group = within(container).getByRole('group');
        expect(group.children[0]).toHaveClass('first');
        expect(group.children[1]).toHaveClass('last');
    });

    it('支持单个标签，Fragment 中的标签直接进入容器', () => {
        const { container } = render(() => (
            <>
                <SplitTagGroup class="single">
                    <Tag>Only</Tag>
                </SplitTagGroup>
                <SplitTagGroup class="fragment">
                    <>
                        <Tag>A</Tag>
                        <Tag>B</Tag>
                    </>
                </SplitTagGroup>
            </>
        ));
        const single = container.querySelector('.single') as HTMLElement;
        expect(single.children).toHaveLength(1);
        expect(single).toHaveTextContent('Only');
        expect((container.querySelector('.fragment') as HTMLElement).children).toHaveLength(2);
    });

    it('子元素变化时同步渲染并保留已有节点', () => {
        const [extra, setExtra] = createSignal(false);
        const { container } = render(() => (
            <SplitTagGroup>
                <Tag>A</Tag>
                {extra() && <Tag>C</Tag>}
            </SplitTagGroup>
        ));
        const group = container.querySelector('[role="group"]') as HTMLElement;
        const first = group.firstElementChild;
        setExtra(true);
        expect(group.children).toHaveLength(2);
        expect(group.firstElementChild).toBe(first);
        expect(group.lastElementChild).toHaveTextContent('C');
    });

    it('保留嵌套标签与文本，跳过空节点', () => {
        const { container } = render(() => (
            <SplitTagGroup>
                {null}
                <Tag>
                    outer<Tag>nested</Tag>
                </Tag>
                {false}text<Tag>B</Tag>
            </SplitTagGroup>
        ));
        const group = container.querySelector('[role="group"]') as HTMLElement;
        expect(group.children).toHaveLength(2);
        expect(group).toHaveTextContent('outernestedtextB');
    });
});
