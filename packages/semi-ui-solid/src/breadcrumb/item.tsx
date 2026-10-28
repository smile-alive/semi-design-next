import { Show, children, createMemo, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/breadcrumb/constants';
import BreadcrumbItemFoundation, { type BreadcrumbItemAdapter } from '@fibrae/semi-foundation/breadcrumb/item-foundation';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import hasContent from '../_base/has-content';
import { createIconSlot } from '../_base/icon-slot';
import mergeRefs from '../_base/merge-refs';
import { createToken } from '../_base/token';
import useFoundation from '../_base/use-foundation';
import Typography, { type ShowTooltip } from '../typography';
import { useBreadContext } from './context';
import type { BreadcrumbItemInfo, BreadcrumbItemProps, BreadcrumbItemViewProps } from './interface';

const clsPrefix = cssClasses.PREFIX;

export const BREADCRUMB_ITEM = 'Breadcrumb.Item';

type Foundation = BreadcrumbItemFoundation<BreadcrumbItemViewProps, object, MouseEvent>;
type Adapter = BreadcrumbItemAdapter<BreadcrumbItemViewProps, object, MouseEvent>;

// Breadcrumb renders the item from this token (ItemView); standing alone it renders nothing
export default function BreadcrumbItem(props: BreadcrumbItemProps) {
    return createToken(BREADCRUMB_ITEM, props);
}

export function ItemView(props: BreadcrumbItemViewProps) {
    const [local, rest] = splitProps(props, ['active', 'children', 'class', 'href', 'icon', 'noLink', 'onClick', 'ref', 'route', 'separator', 'shouldRenderSeparator']);

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

    const iconNode = createIconSlot(
        () => local.icon,
        () => (view().compact ? 'small' : 'default'),
        () => `${clsPrefix}-item-icon`
    );

    const tooltip = createMemo(() => BreadcrumbItemFoundation.getTooltipConfig(view().showTooltip));

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
                        <span class={`${clsPrefix}-item-title ${clsPrefix}-item-title-inline`}>{body()}</span>
                    </Show>
                }
            >
                <span class={`${clsPrefix}-item-title`}>
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
        clsx(`${clsPrefix}-item`, {
            [`${clsPrefix}-item-active`]: local.active,
            [`${clsPrefix}-item-link`]: !local.noLink,
        });

    const isKeyboardLink = () => BreadcrumbItemFoundation.isKeyboardLink({ active: local.active, hasHref: hasHref(), noLink: local.noLink, hasOnClick: Boolean(local.onClick) || view().hasOnClick });

    const handleClick = (e: MouseEvent) => foundation.handleClick(itemInfo(), e);

    const handleKeyDown = (e: KeyboardEvent & { currentTarget: HTMLElement }) => foundation.handleKeyDown(e, isKeyboardLink());

    return (
        <span {...rest} ref={mergeRefs(local.ref)} class={clsx(`${clsPrefix}-item-wrap`, local.class)} aria-current={local.active ? 'page' : undefined}>
            <Show
                when={local.active || !hasHref()}
                fallback={
                    <a class={itemClass()} href={local.href} onClick={handleClick}>
                        {inner()}
                    </a>
                }
            >
                <span class={itemClass()} role={isKeyboardLink() ? 'link' : undefined} tabIndex={isKeyboardLink() ? 0 : undefined} onClick={handleClick} onKeyDown={handleKeyDown}>
                    {inner()}
                </span>
            </Show>
            <Show when={local.shouldRenderSeparator ?? true}>
                <Show when={hasContent(ownSeparator())} fallback={<span class={`${clsPrefix}-separator`}>{context.separator()}</span>}>
                    {ownSeparator()}
                </Show>
            </Show>
        </span>
    );
}
