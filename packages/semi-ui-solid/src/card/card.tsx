import { children, createMemo, Index, Show, splitProps, type JSX } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/card/constants';
import '@fibrae/semi-foundation/card/card.scss';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import Skeleton from '../skeleton';
import Space from '../space';
import Typography from '../typography';
import Meta from './meta';

const prefixCls = cssClasses.PREFIX;

export type Shadows = 'hover' | 'always';

type Style = JSX.CSSProperties | string;

// namedRole yields a plain string, which the typed role attribute does not accept
type Role = JSX.HTMLAttributes<HTMLDivElement>['role'];

export interface CardProps extends ElementProps<'div', 'title'> {
    /** Operation group at the bottom of the card content area */
    actions?: JSX.Element[];
    bodyStyle?: Style;
    bordered?: boolean;
    cover?: JSX.Element;
    /** Additional content to the right of the title */
    headerExtraContent?: JSX.Element;
    footer?: JSX.Element;
    /** Whether there is a border between the content area and the footer */
    footerLine?: boolean;
    footerStyle?: Style;
    /** Replaces `title` and `headerExtraContent` */
    header?: JSX.Element;
    /** Whether there is a border between the header and the content area */
    headerLine?: boolean;
    headerStyle?: Style;
    loading?: boolean;
    shadows?: Shadows;
    title?: JSX.Element;
}

const defaultProps = {
    bordered: true,
    footerLine: false,
    headerLine: true,
    loading: false,
} satisfies Partial<CardProps>;

function Card(rawProps: CardProps) {
    const props = useDefaultProps('Card', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['actions', 'bodyStyle', 'bordered', 'children', 'class', 'cover', 'footer', 'footerLine', 'footerStyle', 'header', 'headerExtraContent', 'headerLine', 'headerStyle', 'loading', 'shadows', 'title']);

    const header = children(() => local.header);
    const headerExtraContent = children(() => local.headerExtraContent);
    const title = children(() => local.title);
    const cover = children(() => local.cover);
    const footer = children(() => local.footer);

    // A loading card shows the placeholder instead, so the body is created once it shows. Whether it has any content
    // cannot be known before that without creating it, so a loading card only checks that children were passed.
    const loading = createMemo(() => local.loading);
    const body = children(() => (loading() ? undefined : local.children));
    const hasBody = createMemo(() => (loading() ? 'children' in local : hasContent(body())));

    // read once: the array holds nodes that were built when the prop was read
    const actions = createMemo(() => {
        const value = local.actions;
        return Array.isArray(value) ? value : undefined;
    });

    return (
        <div
            {...rest}
            role={namedRole(rest.role, rest['aria-label'], rest['aria-labelledby']) as Role}
            class={clsx(prefixCls, local.class, {
                [`${prefixCls}-bordered`]: local.bordered,
                [`${prefixCls}-shadows`]: local.shadows,
                [`${prefixCls}-shadows-${local.shadows}`]: local.shadows,
            })}
            aria-busy={local.loading}
        >
            <Show when={hasContent(header()) || hasContent(headerExtraContent()) || hasContent(title())}>
                <div class={clsx(`${prefixCls}-header`, { [`${prefixCls}-header-bordered`]: local.headerLine })} style={local.headerStyle}>
                    <Show
                        when={hasContent(header())}
                        fallback={
                            <div class={`${prefixCls}-header-wrapper`}>
                                <Show when={hasContent(title())}>
                                    <div class={clsx(`${prefixCls}-header-wrapper-title`, { [`${prefixCls}-header-wrapper-spacing`]: hasContent(headerExtraContent()) })}>
                                        <Show when={typeof title() === 'string'} fallback={title()}>
                                            <Typography.Title
                                                // the title names the card; a heading here would break the page outline
                                                component="div"
                                                ellipsis={{ showTooltip: true, rows: 1 }}
                                                heading={6}
                                                x-semi-prop="title"
                                            >
                                                {title()}
                                            </Typography.Title>
                                        </Show>
                                    </div>
                                </Show>
                                <Show when={hasContent(headerExtraContent())}>
                                    <div class={`${prefixCls}-header-wrapper-extra`} x-semi-prop="headerExtraContent">
                                        {headerExtraContent()}
                                    </div>
                                </Show>
                            </div>
                        }
                    >
                        {header()}
                    </Show>
                </div>
            </Show>
            <Show when={hasContent(cover())}>
                <div class={`${prefixCls}-cover`} x-semi-prop="cover">
                    {cover()}
                </div>
            </Show>
            <div class={`${prefixCls}-body`} style={local.bodyStyle}>
                <Show when={hasBody()}>
                    <Skeleton
                        placeholder={
                            <div>
                                <Skeleton.Title />
                                <br />
                                <Skeleton.Paragraph rows={3} />
                            </div>
                        }
                        active
                        loading={local.loading}
                    >
                        {body()}
                    </Skeleton>
                </Show>
                <Show when={actions()}>
                    {(items) => (
                        <div class={`${prefixCls}-body-actions`}>
                            <Space spacing={12}>
                                <Index each={items()}>
                                    {(item, index) => (
                                        <div class={`${prefixCls}-body-actions-item`} x-semi-prop={`actions.${index}`}>
                                            {item()}
                                        </div>
                                    )}
                                </Index>
                            </Space>
                        </div>
                    )}
                </Show>
            </div>
            <Show when={hasContent(footer())}>
                <div class={clsx(`${prefixCls}-footer`, { [`${prefixCls}-footer-bordered`]: local.footerLine })} style={local.footerStyle} x-semi-prop="footer">
                    {footer()}
                </div>
            </Show>
        </div>
    );
}

export default Object.assign(Card, { Meta });
