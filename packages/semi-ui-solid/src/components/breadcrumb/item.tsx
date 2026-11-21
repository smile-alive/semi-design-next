import { Show, children, createMemo, createRenderEffect, splitProps } from 'solid-js';
import { isServer, style as setStyle } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/breadcrumb/constants';
import BreadcrumbItemFoundation, { type BreadcrumbItemAdapter } from '@fibrae/semi-foundation/components/breadcrumb/item-foundation';
import { toCssLength } from '@fibrae/semi-foundation/utils';
import { createToken, useFoundation } from '../../base/index';
import { hasContent, createIconSlot, mergeRefs, mergeStyles } from '../../utils/index';
import Typography, { type ShowTooltip } from '../typography';
import { useBreadContext } from './context';
import type { BreadcrumbItemInfo, BreadcrumbItemProps, BreadcrumbItemViewProps, BreadcrumbProps } from './interface';

const clsPrefix = cssClasses.PREFIX;

export const BREADCRUMB_ITEM = 'Breadcrumb.Item';

type Foundation = BreadcrumbItemFoundation<BreadcrumbItemViewProps, MouseEvent>;
type Adapter = BreadcrumbItemAdapter<BreadcrumbItemViewProps, MouseEvent>;

// Breadcrumb renders the item from this token (ItemView); standing alone it renders nothing
export default function BreadcrumbItem(props: BreadcrumbItemProps) {
    return createToken(BREADCRUMB_ITEM, props);
}

export function ItemView(props: BreadcrumbItemViewProps) {
    const [local, rest] = splitProps(props, ['active', 'children', 'class', 'classNames', 'href', 'icon', 'noLink', 'onClick', 'ref', 'route', 'separator', 'shouldRenderSeparator', 'style', 'styles']);

    const context = useBreadContext('Breadcrumb.Item');

    const { foundation } = useFoundation<Foundation, Adapter, BreadcrumbItemViewProps, object>(
        BreadcrumbItemFoundation,
        props,
        () => ({}),
        (base) => ({
            notifyClick: (item, e) => base.getProps().onClick?.(item, e),
            notifyParent: (item, e) => context.onClick(item, e),
        })
    );

    const view = context.view;
    const body = children(() => local.children);
    const ownSeparator = children(() => local.separator);
    const tooltip = createMemo(() => BreadcrumbItemFoundation.getTooltipConfig(view().showTooltip));

    // Parent `item*` keys first, the item's own keys after
    const cls = (own: string, parentKey: keyof NonNullable<BreadcrumbProps['classNames']>, key: keyof NonNullable<BreadcrumbItemProps['classNames']>) => clsx(own, view().classNames?.[parentKey], local.classNames?.[key]);

    const iconNode = createIconSlot(
        () => local.icon,
        () => (view().compact ? 'small' : 'default'),
        () => cls(`${clsPrefix}-item-icon`, 'itemIcon', 'icon')
    );

    const sty = (parentKey: keyof NonNullable<BreadcrumbProps['styles']>, key: keyof NonNullable<BreadcrumbItemProps['styles']>) => mergeStyles(view().styles?.[parentKey], local.styles?.[key]);

    const hasHref = () => local.href != null;

    const isText = () => {
        const value = body();
        return typeof value === 'number' || (typeof value === 'string' && value !== '');
    };

    const itemInfo = (): BreadcrumbItemInfo => local.route ?? { name: body(), ...(hasHref() && { href: local.href }) };

    const inner = () => (
        <>
            {iconNode()}
            <Show
                when={isText()}
                fallback={
                    <Show when={hasContent(body())}>
                        <span class={clsx(cls(`${clsPrefix}-item-title`, 'itemTitle', 'title'), `${clsPrefix}-item-title-inline`)} style={sty('itemTitle', 'title')}>
                            {body()}
                        </span>
                    </Show>
                }
            >
                <span class={cls(`${clsPrefix}-item-title`, 'itemTitle', 'title')} style={sty('itemTitle', 'title')}>
                    <Typography.Text
                        style={{ 'max-width': toCssLength(tooltip().width) }}
                        ellipsis={{
                            // Breadcrumb documents opts as TooltipProps; Typography types them as Popover & Tooltip
                            showTooltip: tooltip().opts ? { opts: tooltip().opts as ShowTooltip['opts'] } : false,
                            pos: tooltip().ellipsisPos,
                        }}
                        size={view().compact ? 'small' : 'normal'}
                    >
                        {body()}
                    </Typography.Text>
                </span>
            </Show>
        </>
    );

    const itemClass = () =>
        clsx(
            `${clsPrefix}-item`,
            {
                [`${clsPrefix}-item-active`]: local.active,
                [`${clsPrefix}-item-link`]: !local.noLink,
            },
            view().classNames?.itemLink,
            local.classNames?.link
        );

    const isKeyboardLink = () => BreadcrumbItemFoundation.isKeyboardLink({ active: local.active, hasHref: hasHref(), noLink: local.noLink, hasOnClick: Boolean(local.onClick) || view().hasOnClick });

    const handleClick = (e: MouseEvent) => foundation.handleClick(itemInfo(), e);

    const handleKeyDown = (e: KeyboardEvent & { currentTarget: HTMLElement }) => foundation.handleKeyDown(e, isKeyboardLink());

    // The icon slot only carries classes, so the icon style is applied here; the server HTML goes without it
    createRenderEffect((previous: Map<Element, unknown> = new Map()) => {
        const next = sty('itemIcon', 'icon');
        if (isServer) {
            return previous;
        }
        const applied = new Map<Element, unknown>();
        for (const node of iconNode.toArray()) {
            if (node instanceof HTMLElement || node instanceof SVGElement) {
                applied.set(node, setStyle(node as HTMLElement, next as Record<string, string>, previous.get(node) as Record<string, string>));
            }
        }
        return applied;
    });

    return (
        <li {...rest} ref={mergeRefs(local.ref)} class={clsx(`${clsPrefix}-item-wrap`, view().classNames?.item, local.class)} style={mergeStyles(view().styles?.item, local.style)} aria-current={local.active ? 'page' : undefined}>
            <Show
                when={local.active || !hasHref()}
                fallback={
                    <a class={itemClass()} style={sty('itemLink', 'link')} href={local.href} onClick={handleClick}>
                        {inner()}
                    </a>
                }
            >
                <span class={itemClass()} style={sty('itemLink', 'link')} role={isKeyboardLink() ? 'link' : undefined} tabIndex={isKeyboardLink() ? 0 : undefined} onClick={handleClick} onKeyDown={handleKeyDown}>
                    {inner()}
                </span>
            </Show>
            <Show when={local.shouldRenderSeparator ?? true}>
                <Show
                    when={hasContent(ownSeparator())}
                    fallback={
                        <span class={cls(`${clsPrefix}-separator`, 'separator', 'separator')} style={sty('separator', 'separator')}>
                            {context.separator()}
                        </span>
                    }
                >
                    {ownSeparator()}
                </Show>
            </Show>
        </li>
    );
}
