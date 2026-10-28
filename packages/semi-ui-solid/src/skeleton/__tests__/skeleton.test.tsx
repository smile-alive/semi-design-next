import { createSignal, type JSX } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, expectTypeOf, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Skeleton, { type AvatarProps, type BasicProps, type GenericProps, type ParagraphProps } from '..';
import semiGlobal from '../../_utils/semi-global';

const { Avatar, Image, Title, Button, Paragraph } = Skeleton;
const prefixCls = `${BASE_CLASS_PREFIX}-skeleton`;

describe('Skeleton', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('Props 类型只接受有样式的取值，入口导出 BasicProps', () => {
        type Size = NonNullable<AvatarProps['size']>;
        expectTypeOf<Size>().toEqualTypeOf<'extra-extra-small' | 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large'>();
        expectTypeOf<'default'>().not.toExtend<Size>();
        expectTypeOf<NonNullable<AvatarProps['shape']>>().toEqualTypeOf<'circle' | 'square'>();
        expectTypeOf<GenericProps>().toEqualTypeOf<AvatarProps>();
        expectTypeOf<ParagraphProps>().not.toHaveProperty('type');
        expectTypeOf<Parameters<typeof Title>[0]>().toEqualTypeOf<BasicProps>();
    });

    it('显式传入 undefined 的 type 不覆盖骨架自带的类型', () => {
        const { container } = render(() => (
            <>
                <Avatar type={undefined} />
                <Image type={undefined} />
                <Title type={undefined} />
                <Button type={undefined} />
            </>
        ));
        expect(Array.from(container.children, (el) => el.className)).toEqual([expect.stringContaining(`${prefixCls}-avatar`), `${prefixCls}-image`, `${prefixCls}-title`, `${prefixCls}-button`]);
    });

    it('基础加载态', () => {
        const [loading, setLoading] = createSignal(true);
        const { container } = render(() => (
            <Skeleton placeholder={<Avatar />} loading={loading()}>
                <div>content</div>
            </Skeleton>
        ));
        expect(container.querySelector(`.${prefixCls}`)).not.toBeNull();
        expect(screen.queryByText('content')).toBeNull();

        setLoading(false);
        expect(container.querySelector(`.${prefixCls}`)).toBeNull();
        expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('kits 渲染', () => {
        const kits: [() => JSX.Element, string][] = [
            [() => <Avatar />, 'avatar'],
            [() => <Image />, 'image'],
            [() => <Title />, 'title'],
            [() => <Button />, 'button'],
            [() => <Paragraph />, 'paragraph'],
        ];
        for (const [kit, name] of kits) {
            const { container, unmount } = render(kit);
            expect(container.querySelector(`.${prefixCls}-${name}`)).not.toBeNull();
            unmount();
        }
    });

    it('加载容器标记为 busy，并对辅助技术隐藏占位块', () => {
        const [loading, setLoading] = createSignal(true);
        const { container } = render(() => (
            <Skeleton
                loading={loading()}
                placeholder={
                    <>
                        <Avatar />
                        <Title />
                        <Paragraph />
                    </>
                }
            >
                <div>content</div>
            </Skeleton>
        ));
        const root = container.firstElementChild as HTMLElement;
        expect(root).toHaveAttribute('aria-busy', 'true');
        expect(root).not.toHaveAttribute('aria-hidden');
        for (const name of ['avatar', 'title', 'paragraph']) {
            expect(root.querySelector(`.${prefixCls}-${name}`)).toHaveAttribute('aria-hidden', 'true');
        }
        setLoading(false);
        expect(screen.getByText('content').closest('[aria-busy]')).toBeNull();
    });

    it('默认处于加载态，占位在 slot 根节点中渲染，并带有 class、style 和元素属性', () => {
        const { container } = render(() => (
            <Skeleton id="sk" data-x="1" class="wrap" style={{ width: '10px' }} placeholder={<Title />} active>
                <div>content</div>
            </Skeleton>
        ));
        const root = container.firstElementChild as HTMLElement;
        expect(root).toHaveClass(prefixCls, `${prefixCls}-active`, 'wrap');
        expect(root).toHaveStyle({ width: '10px' });
        expect(root).toHaveAttribute('x-semi-prop', 'placeholder');
        expect(root).toHaveAttribute('data-x', '1');
        expect(root).toHaveAttribute('id', 'sk');
        expect(root.querySelector(`.${prefixCls}-title`)).not.toBeNull();
        expect(screen.queryByText('content')).toBeNull();
    });

    it('未设置时不激活动画', () => {
        const { container } = render(() => <Skeleton placeholder={<Title />} />);
        expect(container.firstElementChild).not.toHaveClass(`${prefixCls}-active`);
    });

    it('avatar 默认为 medium 圆形，并接收 size 和 shape', () => {
        const [props, setProps] = createSignal<AvatarProps>({});
        const { container } = render(() => <Avatar {...props()} />);
        expect(container.firstElementChild).toHaveClass(`${prefixCls}-avatar`, `${prefixCls}-avatar-medium`, `${prefixCls}-avatar-circle`);
        setProps({ shape: 'square', size: 'large' });
        expect(container.firstElementChild).toHaveClass(`${prefixCls}-avatar-large`, `${prefixCls}-avatar-square`);
        expect(container.firstElementChild).not.toHaveClass(`${prefixCls}-avatar-medium`);
    });

    it('除 avatar 外的 kits 不添加 size 或 shape 类名，并透传 class、style 和元素属性', () => {
        const kitProps = { 'data-x': '1', shape: 'square', size: 'large' } as BasicProps;
        const kits: [() => JSX.Element, string][] = [
            [() => <Image class="kit" style={{ height: '5px' }} {...kitProps} />, 'image'],
            [() => <Title class="kit" style={{ height: '5px' }} {...kitProps} />, 'title'],
            [() => <Button class="kit" style={{ height: '5px' }} {...kitProps} />, 'button'],
        ];
        for (const [kit, name] of kits) {
            const { container, unmount } = render(kit);
            const root = container.firstElementChild as HTMLElement;
            expect(root.tagName).toBe('DIV');
            expect(root).toHaveClass(`${prefixCls}-${name}`, 'kit');
            expect(root.className).not.toMatch(/large|square|medium|circle/);
            expect(root).toHaveStyle({ height: '5px' });
            expect(root).toHaveAttribute('data-x', '1');
            expect(root).not.toHaveAttribute('size');
            expect(root).not.toHaveAttribute('shape');
            unmount();
        }
    });

    it('paragraph 默认渲染四行，并接收 rows、class 和 style', () => {
        const [rows, setRows] = createSignal<number | undefined>(undefined);
        const { container } = render(() => <Paragraph class="para" style={{ width: '20px' }} rows={rows()} />);
        const list = container.firstElementChild as HTMLElement;
        expect(list.tagName).toBe('UL');
        expect(list.querySelectorAll('li')).toHaveLength(4);
        setRows(2);
        expect(list.querySelectorAll('li')).toHaveLength(2);
        expect(list).toHaveClass(`${prefixCls}-paragraph`, 'para');
        expect(list).toHaveStyle({ width: '20px' });
    });

    it('加载时 ref 指向占位根节点', () => {
        let root: HTMLDivElement | undefined;
        const { container } = render(() => (
            <Skeleton ref={(node) => (root = node)} placeholder={<Title />}>
                <div>content</div>
            </Skeleton>
        ));
        expect(root).toBe(container.firstElementChild);
    });

    it('kit 的 ref 指向其根元素', () => {
        for (const kit of [Avatar, Image, Title, Button]) {
            let root: HTMLDivElement | undefined;
            const { container, unmount } = render(() => kit({ ref: (node) => (root = node as HTMLDivElement) }));
            expect(root).toBe(container.firstElementChild);
            unmount();
        }
        let list: HTMLUListElement | undefined;
        const { container } = render(() => <Paragraph ref={(node) => (list = node)} />);
        expect(list).toBe(container.firstElementChild);
    });

    it('paragraph 把元素属性透传到 ul', () => {
        const { container } = render(() => <Paragraph data-x="1" aria-label="loading" />);
        const list = container.firstElementChild;
        expect(list).toHaveAttribute('data-x', '1');
        expect(list).toHaveAttribute('aria-label', 'loading');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Skeleton: { loading: false, active: true } };
        const [loading, setLoading] = createSignal<boolean | undefined>(undefined);
        const { container } = render(() => (
            <Skeleton placeholder={<Title />} loading={loading()}>
                <div>content</div>
            </Skeleton>
        ));
        expect(screen.getByText('content')).toBeInTheDocument();
        setLoading(true);
        expect(container.firstElementChild).toHaveClass(`${prefixCls}-active`);
    });
});
