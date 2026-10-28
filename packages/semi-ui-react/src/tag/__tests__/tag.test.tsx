import { StrictMode, createRef, useState } from 'react';
import { fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import TagGroup from '../group';
import Tag, { type TagProps } from '../index';
import type { SplitTagGroupProps, TagGroupProps } from '../interface';
import SplitTagGroup from '../split-tag-group';

const closeIcon = (container) => container.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`);
const tagNode = (container: HTMLElement) => container.querySelector(`.${BASE_CLASS_PREFIX}-tag`);

describe('Tag', () => {
    it('可关闭的 Tag 关闭后隐藏自身', async () => {
        const onClose = vi.fn<NonNullable<TagProps['onClose']>>();
        const { container } = render(
            <Tag closable tagKey="k" onClose={onClose}>
                semi
            </Tag>
        );
        expect(tagNode(container)).not.toHaveClass(`${BASE_CLASS_PREFIX}-tag-invisible`);

        await userEvent.click(closeIcon(container));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onClose.mock.calls[0][0]).toBe('semi');
        expect(onClose.mock.calls[0][2]).toBe('k');
        expect(tagNode(container)).toHaveClass(`${BASE_CLASS_PREFIX}-tag-invisible`);
    });

    it('onClose 中 preventDefault 后 Tag 保持可见', async () => {
        const { container } = render(
            <Tag closable onClose={(_value, e) => e.preventDefault()}>
                semi
            </Tag>
        );
        await userEvent.click(closeIcon(container));
        expect(tagNode(container)).not.toHaveClass(`${BASE_CLASS_PREFIX}-tag-invisible`);
    });

    it('受控 visible 不会被关闭操作改变', async () => {
        const onClose = vi.fn<NonNullable<TagProps['onClose']>>();
        const { container } = render(
            <Tag closable visible onClose={onClose}>
                semi
            </Tag>
        );
        await userEvent.click(closeIcon(container));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(tagNode(container)).not.toHaveClass(`${BASE_CLASS_PREFIX}-tag-invisible`);
    });

    it('带 onClick 或可关闭的 Tag 是可聚焦按钮，Enter 触发 onClick', () => {
        const onClick = vi.fn<React.MouseEventHandler>();
        const { container, rerender } = render(<Tag>plain</Tag>);
        expect(tagNode(container)).not.toHaveAttribute('role');
        expect(tagNode(container)).not.toHaveAttribute('tabindex');

        rerender(<Tag onClick={onClick}>click</Tag>);
        expect(tagNode(container)).toHaveAttribute('role', 'button');
        expect(tagNode(container)).toHaveAttribute('tabindex', '0');
        fireEvent.keyDown(tagNode(container), { key: 'Enter' });
        expect(onClick).toHaveBeenCalledTimes(1);

        rerender(<Tag closable>close</Tag>);
        expect(tagNode(container)).toHaveAttribute('role', 'button');
    });

    it('Space 触发可点击 Tag 的 onClick，且不滚动页面', () => {
        const onClick = vi.fn<React.MouseEventHandler>();
        const { container } = render(<Tag onClick={onClick}>click</Tag>);
        const notPrevented = fireEvent.keyDown(tagNode(container), { key: ' ' });
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(notPrevented).toBe(false);
    });

    it('Backspace 和 Delete 关闭可关闭的 Tag，并且仍会触发 onKeyDown', () => {
        const onClose = vi.fn<NonNullable<TagProps['onClose']>>();
        const onKeyDown = vi.fn<React.KeyboardEventHandler>();
        const { container } = render(
            <Tag closable tagKey="k" onClose={onClose} onKeyDown={onKeyDown}>
                semi
            </Tag>
        );
        fireEvent.keyDown(tagNode(container), { key: 'Backspace' });
        expect(onClose).toHaveBeenCalledWith('semi', expect.objectContaining({ type: 'keydown' }), 'k');
        type CloseEvent = React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>;
        expectTypeOf<Parameters<NonNullable<TagProps['onClose']>>[1]>().toEqualTypeOf<CloseEvent>();
        expectTypeOf<Parameters<NonNullable<TagGroupProps['onTagClose']>>[1]>().toEqualTypeOf<CloseEvent>();
        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(tagNode(container)).toHaveClass(`${BASE_CLASS_PREFIX}-tag-invisible`);
    });

    it('字符串子节点自动生成 aria-label，用户传入的值优先', () => {
        const { container, rerender } = render(<Tag closable>semi</Tag>);
        expect(tagNode(container)).toHaveAttribute('aria-label', zh_CN.Tag.closableTag.replace('${tag}', 'semi'));
        rerender(<Tag aria-label="custom">semi</Tag>);
        expect(tagNode(container)).toHaveAttribute('aria-label', 'custom');
    });

    it('文本里的 $&、$$ 按原文写入 aria-label，不当作替换模式', () => {
        const { container } = render(<Tag closable>$&-$$</Tag>);
        expect(tagNode(container)).toHaveAttribute('aria-label', zh_CN.Tag.closableTag.split('${tag}').join('$&-$$'));
    });

    it('多段文本与数字子节点与单个字符串一样生成 aria-label 并可省略', () => {
        const count = 3;
        const { container, rerender } = render(<Tag closable>{count} items</Tag>);
        expect(tagNode(container)).toHaveAttribute('aria-label', zh_CN.Tag.closableTag.replace('${tag}', '3 items'));
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-tag-content-ellipsis`)).not.toBeNull();
        rerender(<Tag onClick={() => {}}>{5}</Tag>);
        expect(tagNode(container)).toHaveAttribute('aria-label', zh_CN.Tag.tag.replace('${tag}', '5'));
    });

    it('不可交互的 Tag 不写 aria-label，非字符串子节点的可交互 Tag 也没有空的 aria-label', () => {
        const { container, rerender } = render(<Tag>semi</Tag>);
        expect(tagNode(container)).not.toHaveAttribute('aria-label');
        rerender(
            <Tag onClick={() => {}}>
                <span>semi</span>
            </Tag>
        );
        expect(tagNode(container)).not.toHaveAttribute('aria-label');
        rerender(<Tag onClick={() => {}}>semi</Tag>);
        expect(tagNode(container)).toHaveAttribute('aria-label', zh_CN.Tag.tag.replace('${tag}', 'semi'));
    });

    it('TagGroup 中文字相同的标签关闭第一个后，第二个仍然显示', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { container } = render(
            <TagGroup
                tagList={[
                    { children: '待办', closable: true },
                    { children: '待办', closable: true },
                ]}
            />
        );
        await userEvent.click(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag-close`)[0]);
        const tags = Array.from(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag`));
        expect(tags.map((tag) => tag.classList.contains(`${BASE_CLASS_PREFIX}-tag-invisible`))).toEqual([true, false]);
        expect(error).not.toHaveBeenCalled();
        error.mockRestore();
    });

    it('TagGroup 没有 tagKey 时，在关闭回调里移除标签，后一个标签不继承已关闭标签的隐藏状态', async () => {
        const Probe = () => {
            const [list, setList] = useState(['A', 'B', 'C']);
            return <TagGroup tagList={list.map((children) => ({ children, closable: true }))} onTagClose={(children) => setList((prev) => prev.filter((item) => item !== children))} />;
        };
        const { container } = render(<Probe />);
        await userEvent.click(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag-close`)[1]);
        const tags = Array.from(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag`));
        expect(tags.map((tag) => tag.textContent)).toEqual(['A', 'C']);
        tags.forEach((tag) => expect(tag).not.toHaveClass(`${BASE_CLASS_PREFIX}-tag-invisible`));
    });

    it('读取 semiGlobal overrideDefaultProps 中的默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Tag: { color: 'red', size: 'large' } };
        try {
            const { container, rerender } = render(<Tag>semi</Tag>);
            expect(tagNode(container)).toHaveClass(`${BASE_CLASS_PREFIX}-tag-large`, `${BASE_CLASS_PREFIX}-tag-red-light`);
            rerender(<Tag size="small">semi</Tag>);
            expect(tagNode(container)).toHaveClass(`${BASE_CLASS_PREFIX}-tag-small`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('StrictMode 下只关闭一次', async () => {
        const onClose = vi.fn<NonNullable<TagProps['onClose']>>();
        const { container } = render(
            <StrictMode>
                <Tag closable onClose={onClose}>
                    semi
                </Tag>
            </StrictMode>
        );
        await userEvent.click(closeIcon(container));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(tagNode(container)).toHaveClass(`${BASE_CLASS_PREFIX}-tag-invisible`);
    });

    it('ref 指向根元素', () => {
        const ref = createRef<HTMLDivElement>();
        const { container } = render(<Tag ref={ref}>semi</Tag>);
        expect(ref.current).toBe(tagNode(container));
    });

    it('TagGroup 与 SplitTagGroup 的 ref 指向根元素，Props 声明了 ref', () => {
        expectTypeOf<{ tagList: TagProps[]; ref: React.Ref<HTMLDivElement> }>().toExtend<TagGroupProps>();
        expectTypeOf<{ ref: React.Ref<HTMLDivElement> }>().toExtend<SplitTagGroupProps>();
        const groupRef = createRef<HTMLDivElement>();
        const splitRef = createRef<HTMLDivElement>();
        const { container } = render(
            <>
                <TagGroup ref={groupRef} tagList={[{ children: 'a' }]} />
                <SplitTagGroup ref={splitRef}>
                    <Tag>b</Tag>
                </SplitTagGroup>
            </>
        );
        expect(groupRef.current).toBe(container.querySelector(`.${BASE_CLASS_PREFIX}-tag-group`));
        expect(splitRef.current).toBe(container.querySelector(`.${BASE_CLASS_PREFIX}-tag-split`));
    });

    it('TagGroup 的 tagList 必填，且元素类型由 mode 决定', () => {
        expectTypeOf<{ mode?: undefined; tagList: TagProps[] }>().toExtend<TagGroupProps>();
        expectTypeOf<{ mode: 'custom'; tagList: React.ReactNode[] }>().toExtend<TagGroupProps>();
        expectTypeOf<{ mode: 'custom'; tagList: TagProps[] }>().not.toExtend<TagGroupProps>();
        expectTypeOf<{ mode?: undefined; tagList: string[] }>().not.toExtend<TagGroupProps>();
        expectTypeOf<{ size: 'small' }>().not.toExtend<TagGroupProps>();
    });

    it('TagGroup 中没有 tagKey 的 Tag 在多次渲染间保持挂载', () => {
        const tagList = [{ children: <span>a</span> }, { children: <span>b</span> }];
        const { container, rerender } = render(<TagGroup tagList={tagList} />);
        const before = Array.from(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag`));
        rerender(<TagGroup tagList={[...tagList]} />);
        Array.from(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag`)).forEach((tag, index) => expect(tag).toBe(before[index]));
    });

    it('头像图片是装饰性的，因为文字就在旁边', () => {
        const { container } = render(<Tag avatarSrc="avatar.png">Douyin</Tag>);
        expect(container.querySelector('img')).toHaveAttribute('alt', '');
    });

    it('issue 1107：TagGroup 不会把默认值写入共享的 tagList', () => {
        const tagList = ['Douyin', 'Hotsoon', 'Capcut', 'Xingtu'].map((children): TagProps => ({
            color: 'white',
            children,
            avatarSrc: 'avatar.png',
        }));
        const snapshot = tagList.map((tag) => ({ ...tag }));
        const { container } = render(
            <>
                <TagGroup className="small-group" maxTagCount={3} size="small" tagList={tagList} />
                <TagGroup className="large-group" avatarShape="circle" maxTagCount={2} size="large" tagList={tagList} />
            </>
        );
        expect(tagList).toEqual(snapshot);
        const avatarTags = (group) => Array.from(container.querySelectorAll(`.${group} .${BASE_CLASS_PREFIX}-tag`)).filter((tag) => tag.querySelector('img'));
        // The second group must get its own size and shape, not the ones the first group left on the shared objects
        const largeTags = avatarTags('large-group');
        expect(largeTags).toHaveLength(2);
        largeTags.forEach((tag) => {
            expect(tag).toHaveClass(`${BASE_CLASS_PREFIX}-tag-large`, `${BASE_CLASS_PREFIX}-tag-avatar-circle`);
        });
        const smallTags = avatarTags('small-group');
        expect(smallTags).toHaveLength(3);
        smallTags.forEach((tag) => {
            expect(tag).toHaveClass(`${BASE_CLASS_PREFIX}-tag-small`, `${BASE_CLASS_PREFIX}-tag-avatar-square`);
        });
    });
});
