import { StrictMode, createRef, type ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { Card, Rating, Typography, Avatar, CardGroup } from '@fibrae/semi-ui-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import type { SpaceProps } from '@fibrae/semi-ui-react/space';
import type { CardGroupProps } from '../card-group';

const { Meta } = Card;
const prefixCls = `${BASE_CLASS_PREFIX}-card`;

function queryCard(props, selectors) {
    const { container, unmount } = render(<Card {...props} />);
    const result = selectors.map((selector) => container.querySelectorAll(selector).length);
    unmount();
    return result;
}

describe('Card', () => {
    it('带 actions 的 Card', () => {
        const propsWithActions = {
            actions: [<Rating key="1" defaultValue={4} />, <Rating key="2" defaultValue={4} />],
        };
        const selectors = [`.${prefixCls}-body-actions`, `.${prefixCls}-body-actions-item`];
        expect(queryCard(propsWithActions, selectors)).toEqual([1, 2]);
        expect(queryCard({}, selectors)).toEqual([0, 0]);
    });

    it('带 bordered 的 Card', () => {
        const selectors = [`.${prefixCls}-bordered`];
        expect(queryCard({ bordered: true }, selectors)).toEqual([1]);
        expect(queryCard({ bordered: false }, selectors)).toEqual([0]);
    });

    it('带 cover 的 Card', () => {
        const propsWithCover = {
            cover: <img alt="example" src="https://example.com/card-cover-docs-demo.jpeg" />,
        };
        const selectors = [`.${prefixCls}-cover`, `.${prefixCls}-cover img[alt="example"]`];
        expect(queryCard(propsWithCover, selectors)).toEqual([1, 1]);
        expect(queryCard({}, selectors)).toEqual([0, 0]);
    });

    it('带 headerExtraContent 的 Card', () => {
        const propsWithHeaderExtraContent = {
            headerExtraContent: <Typography.Text link={{}}>更多</Typography.Text>,
        };
        const selectors = [`.${prefixCls}-header-wrapper-extra`];
        expect(queryCard(propsWithHeaderExtraContent, selectors)).toEqual([1]);
        expect(queryCard({}, selectors)).toEqual([0]);
    });

    it('带 footer/header 的 Card', () => {
        const propsWithFooter = {
            footer: <Typography.Text link={{}}>更多</Typography.Text>,
            header: <Typography.Text link={{}}>更多</Typography.Text>,
        };
        const selectors = [`.${prefixCls}-footer`, `.${prefixCls}-header`];
        expect(queryCard(propsWithFooter, selectors)).toEqual([1, 1]);
        expect(queryCard({}, selectors)).toEqual([0, 0]);
    });

    it('带 footerLine/headerLine 的 Card', () => {
        const propsWithLine = {
            footer: <Typography.Text link={{}}>更多</Typography.Text>,
            header: <Typography.Text link={{}}>更多</Typography.Text>,
            headerLine: true,
            footerLine: true,
        };
        const selectors = [`.${prefixCls}-header-bordered`, `.${prefixCls}-footer-bordered`];
        expect(queryCard(propsWithLine, selectors)).toEqual([1, 1]);

        const props = {
            footer: <Typography.Text link={{}}>更多</Typography.Text>,
            header: <Typography.Text link={{}}>更多</Typography.Text>,
            headerLine: false,
            footerLine: false,
        };
        expect(queryCard(props, selectors)).toEqual([0, 0]);
    });

    it('带 title 的 Card', () => {
        const { container, unmount } = render(<Card title="semi" />);
        expect(container.querySelector(`.${prefixCls}-header-wrapper-title`)).toHaveTextContent(/^semi$/);
        unmount();

        expect(queryCard({}, [`.${prefixCls}-header-wrapper-title`])).toEqual([0]);
    });

    it('带 loading 的 Card', () => {
        const skeletonSelector = `.${prefixCls}-body .${BASE_CLASS_PREFIX}-skeleton`;
        const { container, unmount } = render(<Card loading>content</Card>);
        expect(container.querySelector(skeletonSelector)).not.toBeNull();
        expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
        expect(container).not.toHaveTextContent('content');
        unmount();

        const { container: container2 } = render(<Card loading={false}>content</Card>);
        expect(container2.querySelector(skeletonSelector)).toBeNull();
        expect(container2).toHaveTextContent(/^content$/);
    });

    it('带 shadows 的 Card', () => {
        expect(queryCard({ shadows: 'hover' }, [`.${prefixCls}-shadows-hover`])).toEqual([1]);
        expect(queryCard({ shadows: 'always' }, [`.${prefixCls}-shadows-always`])).toEqual([1]);
    });

    it('自定义 className 的 Card', () => {
        const { container } = render(<Card className="test" />);
        expect(container.firstChild).toHaveClass(prefixCls, 'test');
    });

    it('Card Meta', () => {
        const { container } = render(<Meta title="title" avatar={<Avatar size="default" src="https://example.com/card-meta-avatar-docs-demo.jpg" />} description="description" />);
        expect(container.querySelector(`.${prefixCls}-meta`)).not.toBeNull();
        expect(container.querySelector(`.${prefixCls}-meta-avatar img`)).not.toBeNull();
        expect(container.querySelector(`.${prefixCls}-meta-wrapper`)).not.toBeNull();
        expect(container.querySelector(`.${prefixCls}-meta-wrapper-title`)).toHaveTextContent(/^title$/);
        expect(container.querySelector(`.${prefixCls}-meta-wrapper-description`)).toHaveTextContent(/^description$/);
    });

    it('Card Group', () => {
        const { container } = render(
            <CardGroup spacing={16}>
                {Array.from(Array(10)).map((_i, idx) => (
                    <Card key={idx}>Content</Card>
                ))}
            </CardGroup>
        );
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-space`)).not.toBeNull();
        expect(container.querySelectorAll(`.${prefixCls}`)).toHaveLength(10);
        expect(screen.getAllByText('Content')).toHaveLength(10);
    });

    it('默认值：bordered 开启、header 分隔线开启、footer 分隔线关闭、非 busy、无阴影', () => {
        const { container } = render(<Card title="t" footer="f" />);
        const card = container.firstChild;
        expect(card).toHaveClass(prefixCls, `${prefixCls}-bordered`);
        expect(card).not.toHaveClass(`${prefixCls}-shadows`);
        expect(card).toHaveAttribute('aria-busy', 'false');
        expect(container.querySelector(`.${prefixCls}-header`)).toHaveClass(`${prefixCls}-header-bordered`);
        expect(container.querySelector(`.${prefixCls}-footer`)).not.toHaveClass(`${prefixCls}-footer-bordered`);
    });

    it('按顺序渲染 header、cover、body 与 footer，并应用各自的样式', () => {
        const { container } = render(
            <Card bodyStyle={{ color: 'blue' }} footerStyle={{ color: 'yellow' }} headerStyle={{ color: 'green' }} style={{ color: 'red' }} title="t" cover={<img alt="c" />} footer="f">
                body
            </Card>
        );
        const card = container.firstChild as HTMLElement;
        expect([...card.children].map((el) => el.className)).toEqual([`${prefixCls}-header ${prefixCls}-header-bordered`, `${prefixCls}-cover`, `${prefixCls}-body`, `${prefixCls}-footer`]);
        expect(card).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(card.children[0]).toHaveStyle({ color: 'rgb(0, 128, 0)' });
        expect(card.children[2]).toHaveStyle({ color: 'rgb(0, 0, 255)' });
        expect(card.children[2]).toHaveTextContent(/^body$/);
        expect(card.children[3]).toHaveStyle({ color: 'rgb(255, 255, 0)' });
    });

    it('header 优先于 title 与 headerExtraContent', () => {
        const { container } = render(<Card title="t" header={<b>h</b>} headerExtraContent="x" />);
        const header = container.querySelector(`.${prefixCls}-header`);
        expect(header.innerHTML).toBe('<b>h</b>');
        expect(container.querySelector(`.${prefixCls}-header-wrapper`)).toBeNull();
    });

    it('DOM 中 title 在 headerExtraContent 之前', () => {
        const { container } = render(<Card title="t" headerExtraContent="x" />);
        const wrapper = container.querySelector(`.${prefixCls}-header-wrapper`);
        expect(Array.from(wrapper.children, (el) => el.className.split(' ')[0])).toEqual([`${prefixCls}-header-wrapper-title`, `${prefixCls}-header-wrapper-extra`]);
    });

    it('字符串 title 渲染为无标题语义、h6 样式的省略号 div，节点类型 title 原样渲染', () => {
        const { container, unmount } = render(<Card title="semi" headerExtraContent="more" />);
        const title = container.querySelector(`.${prefixCls}-header-wrapper-title`);
        expect(title).toHaveClass(`${prefixCls}-header-wrapper-spacing`);
        expect(screen.queryByRole('heading')).toBeNull();
        const text = title.querySelector('.semi-typography-h6');
        expect(text.tagName).toBe('DIV');
        expect(text).toHaveTextContent(/^semi$/);
        expect(text).toHaveAttribute('x-semi-prop', 'title');
        expect(container.querySelector(`.${prefixCls}-header-wrapper-extra`)).toHaveAttribute('x-semi-prop', 'headerExtraContent');
        unmount();

        const { container: container2 } = render(<Card title={<em>node</em>} />);
        const title2 = container2.querySelector(`.${prefixCls}-header-wrapper-title`);
        expect(title2).not.toHaveClass(`${prefixCls}-header-wrapper-spacing`);
        expect(title2.innerHTML).toBe('<em>node</em>');
    });

    it('为 cover、footer 与 actions 标记 x-semi-prop 插槽', () => {
        const { container } = render(<Card actions={['a', 'b']} cover="c" footer="f" />);
        expect(container.querySelector(`.${prefixCls}-cover`)).toHaveAttribute('x-semi-prop', 'cover');
        expect(container.querySelector(`.${prefixCls}-footer`)).toHaveAttribute('x-semi-prop', 'footer');
        const items = container.querySelectorAll(`.${prefixCls}-body-actions-item`);
        expect([...items].map((item) => item.getAttribute('x-semi-prop'))).toEqual(['actions.0', 'actions.1']);
        expect(container.querySelector(`.${prefixCls}-body-actions .${BASE_CLASS_PREFIX}-space`)).not.toBeNull();
    });

    it('忽略非数组的 actions，无 children 时不渲染骨架屏', () => {
        // a deliberately invalid value: actions must be an array
        const notAnArray = 'a' as unknown as ReactNode[];
        const { container } = render(<Card actions={notAnArray} loading />);
        expect(container.querySelector(`.${prefixCls}-body-actions`)).toBeNull();
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-skeleton`)).toBeNull();
        expect(container.querySelector(`.${prefixCls}-body`)).toBeEmptyDOMElement();
        expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
    });

    it('loading 时显示带标题与三行段落的骨架屏占位', () => {
        const { container } = render(<Card loading>content</Card>);
        const skeleton = container.querySelector(`.${BASE_CLASS_PREFIX}-skeleton`);
        expect(skeleton).toHaveClass(`${BASE_CLASS_PREFIX}-skeleton-active`);
        expect(skeleton.querySelector(`.${BASE_CLASS_PREFIX}-skeleton-title`)).not.toBeNull();
        expect(skeleton.querySelectorAll(`.${BASE_CLASS_PREFIX}-skeleton-paragraph li`)).toHaveLength(3);
    });

    it('将 aria-label 与 data-* 传给根元素，已声明的属性不放在根元素上', () => {
        const onClick = vi.fn<React.MouseEventHandler>();
        const rootAttrs = { id: 'c', 'data-testid': 'card', onClick };
        render(<Card {...rootAttrs} aria-label="card" title="t" actions={['a']} bordered cover="c" footer="f" footerLine header="h" headerLine loading={false} shadows="always" />);
        const card = screen.getByTestId('card');
        expect(card).toHaveAttribute('aria-label', 'card');
        expect(card).toHaveAttribute('id', 'c');
        expect(card).toHaveClass(`${prefixCls}-shadows`, `${prefixCls}-shadows-always`);
        const declared = ['title', 'cover', 'footer', 'header', 'loading', 'bordered', 'shadows', 'actions'];
        for (const name of [...declared, 'headerline', 'footerline']) {
            expect(card).not.toHaveAttribute(name);
        }
        fireEvent.click(card);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('Meta 仅渲染传入的部分，并将其他属性传给根元素', () => {
        const { container, unmount } = render(<Meta className="m" style={{ color: 'red' }} data-id="1" />);
        const meta = container.firstChild;
        expect(meta).toHaveClass(`${prefixCls}-meta`, 'm');
        expect(meta).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(meta).toHaveAttribute('data-id', '1');
        expect(meta).toBeEmptyDOMElement();
        unmount();

        const { container: container2 } = render(<Meta description="d" />);
        expect(container2.querySelector(`.${prefixCls}-meta-wrapper`)).not.toBeNull();
        expect(container2.querySelector(`.${prefixCls}-meta-wrapper-title`)).toBeNull();
        expect(container2.querySelector(`.${prefixCls}-meta-avatar`)).toBeNull();
        expect(container2.firstChild).not.toHaveAttribute('description');
    });

    it('有 aria-label 或 aria-labelledby 时根元素是 group，否则没有 role，传入的 role 优先', () => {
        const { rerender } = render(<Card data-testid="card" aria-label="n" />);
        expect(screen.getByRole('group', { name: 'n' })).toBe(screen.getByTestId('card'));
        rerender(<Card data-testid="card" aria-labelledby="x" />);
        expect(screen.getByTestId('card')).toHaveAttribute('role', 'group');
        rerender(<Card data-testid="card" />);
        expect(screen.getByTestId('card')).not.toHaveAttribute('role');
        rerender(<Card data-testid="card" aria-label="n" role="note" />);
        expect(screen.getByTestId('card')).toHaveAttribute('role', 'note');
    });

    it('数字 0 的 title、headerExtraContent、children 照常渲染', () => {
        const { container } = render(
            <Card title={0} headerExtraContent={0}>
                {0}
            </Card>
        );
        expect(container.querySelector(`.${prefixCls}-header-wrapper-title`)).toHaveTextContent(/^0$/);
        expect(container.querySelector(`.${prefixCls}-header-wrapper-extra`)).toHaveTextContent(/^0$/);
        expect(container.querySelector(`.${prefixCls}-body`)).toHaveTextContent(/^0$/);
        expect(container.querySelector(`.${prefixCls}-header-wrapper-title`)).toHaveClass(`${prefixCls}-header-wrapper-spacing`);
    });

    it('header 为 0 时替代 title 渲染在 header 容器内', () => {
        const { container } = render(<Card title="t" header={0} />);
        expect(container.querySelector(`.${prefixCls}-header`)?.innerHTML).toBe('0');
    });

    it('cover、footer 为 0 时渲染在各自容器内，为 false 或 null 时不渲染', () => {
        const { container, rerender } = render(<Card cover={0} footer={0} />);
        expect(container.querySelector(`.${prefixCls}-cover`)).toHaveTextContent(/^0$/);
        expect(container.querySelector(`.${prefixCls}-footer`)).toHaveTextContent(/^0$/);
        expect(container.firstElementChild?.textContent).toBe('00');
        rerender(<Card cover={false} footer={null} />);
        expect(container.querySelector(`.${prefixCls}-cover`)).toBeNull();
        expect(container.querySelector(`.${prefixCls}-footer`)).toBeNull();
    });

    it('CardGroup 的 wrap 显式为 undefined 时仍然换行', () => {
        const { container } = render(
            <CardGroup wrap={undefined}>
                <Card>a</Card>
            </CardGroup>
        );
        expect(container.firstChild).toHaveClass(`${BASE_CLASS_PREFIX}-space-wrap`);
    });

    it('CardGroup 默认用 16px 间距的 Space 包裹', () => {
        const { container } = render(
            <CardGroup className="g" style={{ color: 'red' }}>
                <Card>a</Card>
            </CardGroup>
        );
        const group = container.firstChild;
        expect(group).toHaveClass(`${BASE_CLASS_PREFIX}-space`, `${prefixCls}-group`, 'g', `${BASE_CLASS_PREFIX}-space-wrap`);
        expect(group).not.toHaveClass(`${prefixCls}-group-grid`);
        expect(group).toHaveStyle({ color: 'rgb(255, 0, 0)', columnGap: '16px', rowGap: '16px' });
    });

    it('CardGroup 的 grid 类型不设间距', () => {
        const { container } = render(
            <CardGroup type="grid" spacing={20}>
                <Card>a</Card>
            </CardGroup>
        );
        const group = container.firstChild;
        expect(group).toHaveClass(`${prefixCls}-group-grid`);
        expect(group).toHaveStyle({ columnGap: '0px', rowGap: '0px' });
        expect(group).not.toHaveAttribute('type');
    });

    it('CardGroupProps 声明转给 Space 的 align、vertical、wrap', () => {
        expectTypeOf<CardGroupProps['align']>().toEqualTypeOf<SpaceProps['align']>();
        expectTypeOf<CardGroupProps['vertical']>().toEqualTypeOf<SpaceProps['vertical']>();
        expectTypeOf<CardGroupProps['wrap']>().toEqualTypeOf<SpaceProps['wrap']>();
        expectTypeOf<CardGroupProps['spacing']>().toEqualTypeOf<number | [number, number] | undefined>();
    });

    it('CardGroup 将未声明的属性传给 Space', () => {
        const spaceProps = { align: 'start', vertical: true } as const;
        const { container } = render(
            <CardGroup {...spaceProps} data-id="g" spacing={[8, 4]}>
                <Card>a</Card>
            </CardGroup>
        );
        const group = container.firstChild;
        expect(group).toHaveClass(`${BASE_CLASS_PREFIX}-space-vertical`, `${BASE_CLASS_PREFIX}-space-align-start`);
        expect(group).not.toHaveClass(`${BASE_CLASS_PREFIX}-space-wrap`);
        expect(group).toHaveStyle({ columnGap: '8px', rowGap: '4px' });
        expect(group).toHaveAttribute('data-id', 'g');
    });

    it('StrictMode 下渲染结果一致', () => {
        const { container } = render(
            <StrictMode>
                <CardGroup>
                    <Card title="t" actions={['a']} loading>
                        content
                    </Card>
                </CardGroup>
            </StrictMode>
        );
        expect(container.querySelectorAll(`.${prefixCls}`)).toHaveLength(1);
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-skeleton`)).not.toBeNull();
        expect(container.querySelector(`.${prefixCls}-header-wrapper-title .semi-typography-h6`)).toHaveTextContent(/^t$/);
    });

    it('Card 与 CardGroup 从 semiGlobal overrideDefaultProps 读取默认值，显式传入的属性优先', () => {
        const before = semiGlobal.config.overrideDefaultProps;
        semiGlobal.config.overrideDefaultProps = {
            Card: { bordered: false, shadows: 'hover' },
            CardGroup: { spacing: 8 },
        };
        try {
            const { container } = render(
                <CardGroup>
                    <Card>a</Card>
                    <Card bordered>b</Card>
                </CardGroup>
            );
            const cards = container.querySelectorAll(`.${prefixCls}`);
            expect(cards[0]).not.toHaveClass(`${prefixCls}-bordered`);
            expect(cards[0]).toHaveClass(`${prefixCls}-shadows-hover`);
            expect(cards[1]).toHaveClass(`${prefixCls}-bordered`);
            expect(container.firstChild).toHaveStyle({ columnGap: '8px', rowGap: '8px' });
        } finally {
            semiGlobal.config.overrideDefaultProps = before;
        }
    });

    it('Card、Meta 与 CardGroup 的根元素都挂载 ref', () => {
        const cardRef = createRef<HTMLDivElement>();
        const metaRef = createRef<HTMLDivElement>();
        const groupRef = createRef<HTMLDivElement>();
        const { container } = render(
            <CardGroup ref={groupRef}>
                <Card ref={cardRef}>
                    <Meta ref={metaRef} title="m" />
                </Card>
            </CardGroup>
        );
        expect(groupRef.current).toBe(container.firstChild);
        expect(cardRef.current).toBe(container.querySelector(`.${prefixCls}`));
        expect(metaRef.current).toBe(container.querySelector(`.${prefixCls}-meta`));
    });

    it('Card.Meta 的 avatar、title、description 为 0 时照常渲染', () => {
        const { container } = render(<Meta title={0} avatar={0} description={0} />);
        expect(container.querySelector(`.${prefixCls}-meta-avatar`)).toHaveTextContent(/^0$/);
        expect(container.querySelector(`.${prefixCls}-meta-wrapper-title`)).toHaveTextContent(/^0$/);
        expect(container.querySelector(`.${prefixCls}-meta-wrapper-description`)).toHaveTextContent(/^0$/);
    });
});
