import { type JSX, For, Match, Show, Switch, children, createMemo, splitProps, untrack } from 'solid-js';
import { isServer } from 'solid-js/web';
import clsx from 'clsx';
import { DEFAULT_TOOLTIP, cssClasses } from '@fibrae/semi-foundation/components/breadcrumb/constants';
import BreadcrumbFoundation, { type BreadcrumbAdapter, type BreadcrumbState } from '@fibrae/semi-foundation/components/breadcrumb/foundation';
import getDataAttr from '@fibrae/semi-foundation/utils/get-data-attr';
import warning from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/components/breadcrumb/breadcrumb.scss';
import { IconMore } from '@fibrae/semi-icons-solid';
import { type Token, isToken } from '../../base/token';
import useDefaultProps from '../../base/use-default-props';
import useFoundation from '../../base/use-foundation';
import useFocusHandover from '../../primitives/use-focus-handover';
import isMarkup from '../../utils/is-markup';
import mergeRefs from '../../utils/merge-refs';
import useLocale from '../locale/use-locale';
import Popover from '../popover';
import { BreadContext, type BreadContextValue, type BreadcrumbView } from './context';
import type { BreadcrumbItemProps, BreadcrumbProps, RouteProps } from './interface';
import { BREADCRUMB_ITEM, ItemView } from './item';

const clsPrefix = cssClasses.PREFIX;

type Foundation = BreadcrumbFoundation<BreadcrumbProps>;
type Adapter = BreadcrumbAdapter<BreadcrumbProps>;
type RouteEntry = ReturnType<typeof BreadcrumbFoundation.genRoutes>[number];

const defaultProps = {
    routes: [],
    separator: '/',
    compact: true,
    showTooltip: DEFAULT_TOOLTIP,
    autoCollapse: true,
    moreType: 'default',
    maxItemCount: 4,
} satisfies Partial<BreadcrumbProps>;

const MORE = Symbol('more');

const isRenderable = (node: unknown) => node != null && typeof node !== 'boolean' && node !== '';

export default function Breadcrumb(rawProps: BreadcrumbProps) {
    const props = useDefaultProps('Breadcrumb', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['activeIndex', 'aria-label', 'autoCollapse', 'children', 'class', 'compact', 'maxItemCount', 'moreType', 'onClick', 'ref', 'renderIcon', 'renderItem', 'renderMore', 'routes', 'separator', 'showTooltip']);

    const localeResult = useLocale('Breadcrumb');

    let navElement: HTMLElement | undefined;
    let listElement: HTMLOListElement | undefined;

    const { foundation, state } = useFoundation<Foundation, Adapter, BreadcrumbProps, BreadcrumbState>(
        BreadcrumbFoundation,
        props,
        () => BreadcrumbFoundation.getInitialState(),
        () => ({})
    );

    const view: BreadcrumbView = {
        get compact() {
            return local.compact;
        },
        get hasOnClick() {
            return Boolean(local.onClick);
        },
        get showTooltip() {
            return local.showTooltip;
        },
    };

    const context: BreadContextValue = {
        view: () => view,
        separator: () => local.separator,
        onClick: (info, e) => local.onClick?.(info, e),
    };

    // a spread signal object notifies every key; new route entries or item contents would remount every item
    const routes = createMemo(() => local.routes);
    const renderItem = createMemo(() => local.renderItem);
    const routeEntries = createMemo(() => (routes().length > 0 ? BreadcrumbFoundation.genRoutes(routes()) : undefined));

    // routes win over children, which are then not even created
    const resolved = children(() => (routeEntries() ? undefined : local.children));

    const childEntries = createMemo(() =>
        resolved.toArray().filter((node) => {
            if (!isRenderable(node)) {
                return false;
            }
            if (isToken(node, BREADCRUMB_ITEM)) {
                return true;
            }
            // a DOM element is kept as written; any other object (the token of another component) has nothing to show
            const isForeign = typeof node === 'object' && !isMarkup(node);
            // the server resolves elements to markup and text to strings, with no DOM classes to test against
            warning(isForeign || (isServer ? isMarkup(node) : node instanceof Element), '[Semi Breadcrumb]: Only accepts Breadcrumb.Item as its children');
            return !isForeign;
        })
    );

    // Only Items count and collapse. Other nodes were already created by resolving the children, so they always stay
    // inserted: a created node left out of the DOM breaks hydration.
    const items = createMemo((): unknown[] => routeEntries() ?? childEntries().filter((node) => isToken(node, BREADCRUMB_ITEM)));
    const range = createMemo(() => BreadcrumbFoundation.getCollapseRange(items().length, local.maxItemCount, local.activeIndex), undefined, { equals: (a, b) => a.start === b.start && a.end === b.end });

    const entries = (): unknown[] => routeEntries() ?? childEntries();

    // Expanding removes the more button, which held focus: the first item it hid takes over, else the nav itself
    const handoverFocus = useFocusHandover<HTMLLIElement>(() => {
        const target = listElement?.children[entries().indexOf(items()[range().start])]?.querySelector<HTMLElement>('a[href], [tabindex]:not([tabindex="-1"])');
        if (target) {
            return target;
        }
        if (navElement) {
            navElement.tabIndex = -1;
        }
        return navElement;
    });

    const shouldCollapse = () => BreadcrumbFoundation.shouldCollapse(local.autoCollapse, range(), state().isCollapsed);

    const visible = createMemo((): unknown[] => {
        const all = entries();
        if (!shouldCollapse()) {
            return all;
        }
        const { start, end } = range();
        return all.flatMap((entry) => {
            const index = items().indexOf(entry);
            if (index < start || index > end) {
                return [entry];
            }
            return index === start ? [MORE] : [];
        });
    });

    const hasRenderMore = () => typeof local.renderMore === 'function';

    const restEntries = () => items().slice(range().start, range().end + 1);

    // data only: the props of an Item hold its children and icon as getters, read where renderMore shows them
    const restItems = createMemo(() => restEntries().map((entry): RouteProps | BreadcrumbItemProps => (routeEntries() ? (entry as RouteEntry)._origin : (entry as Token<BreadcrumbItemProps>).props)));

    const hasSeparator = (index: number) => BreadcrumbFoundation.shouldRenderSeparator(index, items().length, { collapsed: shouldCollapse(), ...range(), hasCustomMore: hasRenderMore(), moreType: local.moreType });

    const isActive = (index: number) => BreadcrumbFoundation.isActive(index, items().length, local.activeIndex);

    const routeContent = (route: RouteEntry) => {
        const render = renderItem();
        return render ? render(route._origin) : route.name;
    };

    const renderEntry = (entry: unknown) => {
        const index = () => items().indexOf(entry);
        const separator = () => hasSeparator(index());
        if (routeEntries()) {
            const route = entry as RouteEntry;
            return (
                // only the Item props a route may set, and its data-*, so other route fields stay off the DOM
                <ItemView {...getDataAttr(route)} active={isActive(index())} href={route.href} noLink={route.noLink} route={route._origin} separator={route.separator} shouldRenderSeparator={separator()} icon={local.renderIcon?.(route._origin, index())} onClick={route.onClick}>
                    {routeContent(route)}
                </ItemView>
            );
        }
        if (isToken<BreadcrumbItemProps>(entry, BREADCRUMB_ITEM)) {
            return <ItemView {...entry.props} active={isActive(index())} shouldRenderSeparator={separator()} />;
        }
        // an ol holds only li, so other nodes get one of their own
        return <li>{entry as JSX.Element}</li>;
    };

    const moreArea = () => (
        <li ref={handoverFocus} class={`${clsPrefix}-collapse`}>
            <span class={`${clsPrefix}-item-wrap`}>
                <span class={`${clsPrefix}-item ${clsPrefix}-item-more`} aria-label={localeResult().locale.expand} role="button" tabIndex={0} onClick={foundation.handleExpand} onKeyDown={foundation.handleExpandKeyDown}>
                    <Switch fallback={<IconMore />}>
                        <Match when={hasRenderMore()}>
                            <Show keyed when={local.renderMore}>
                                {/* an array cannot be live, so renderMore is called again when the hidden items change, as in React */}
                                {(renderMore) => <>{renderMore(restItems())}</>}
                            </Show>
                        </Match>
                        <Match when={local.moreType === 'popover'}>
                            <Popover
                                style={{ padding: '12px' }}
                                content={
                                    <ol class={`${clsPrefix}-list`}>
                                        <For each={restEntries()}>
                                            {(entry, i) => (
                                                <>
                                                    {renderEntry(entry)}
                                                    <Show when={i() !== restEntries().length - 1}>
                                                        <li class={`${clsPrefix}-restItem`} aria-hidden="true">
                                                            {local.separator}
                                                        </li>
                                                    </Show>
                                                </>
                                            )}
                                        </For>
                                    </ol>
                                }
                                showArrow
                            >
                                {/* the more button around it is the Tab stop and expands every item; Popover would add 0 here */}
                                {(trigger) => <IconMore {...trigger({ tabIndex: -1 })} />}
                            </Popover>
                        </Match>
                    </Switch>
                </span>
                <span class={`${clsPrefix}-separator`} x-semi-prop="separator">
                    {local.separator}
                </span>
            </span>
        </li>
    );

    return (
        <BreadContext.Provider value={context}>
            <nav
                {...rest}
                // the Provider's children memo tracks this read; a spread signal object would rebuild the whole nav
                ref={untrack(() => mergeRefs(local.ref, (node: HTMLElement) => (navElement = node)))}
                class={clsx(local.class, `${clsPrefix}-wrapper`, {
                    [`${clsPrefix}-wrapper-compact`]: local.compact,
                    [`${clsPrefix}-wrapper-loose`]: !local.compact,
                })}
                aria-label={local['aria-label'] ?? localeResult().locale.label}
            >
                <ol ref={(node) => (listElement = node)} class={`${clsPrefix}-list`}>
                    <For each={visible()}>
                        {(entry) => (
                            <Show when={entry !== MORE} fallback={moreArea()}>
                                {renderEntry(entry)}
                            </Show>
                        )}
                    </For>
                </ol>
            </nav>
        </BreadContext.Provider>
    );
}
