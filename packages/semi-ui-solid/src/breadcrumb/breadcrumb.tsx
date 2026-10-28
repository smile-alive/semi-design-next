import { type JSX, For, Match, Show, Switch, children, createMemo, splitProps, untrack } from 'solid-js';
import { isServer } from 'solid-js/web';
import clsx from 'clsx';
import { DEFAULT_TOOLTIP, cssClasses } from '@fibrae/semi-foundation/breadcrumb/constants';
import BreadcrumbFoundation, { type BreadcrumbAdapter } from '@fibrae/semi-foundation/breadcrumb/foundation';
import getDataAttr from '@fibrae/semi-foundation/utils/get-data-attr';
import warning from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/breadcrumb/breadcrumb.scss';
import { IconMore } from '@fibrae/semi-icons-solid';
import isMarkup from '../_base/is-markup';
import mergeRefs from '../_base/merge-refs';
import { isToken } from '../_base/token';
import useDefaultProps from '../_base/use-default-props';
import useFocusHandover from '../_base/use-focus-handover';
import useFoundation from '../_base/use-foundation';
import useLocale from '../locale/use-locale';
import Popover from '../popover';
import { BreadContext, type BreadContextValue, type BreadcrumbView } from './context';
import type { BreadcrumbItemProps, BreadcrumbProps, RouteProps } from './interface';
import { BREADCRUMB_ITEM, ItemView } from './item';

const clsPrefix = cssClasses.PREFIX;

interface BreadcrumbState {
    isCollapsed: boolean;
}

type Foundation = BreadcrumbFoundation<BreadcrumbProps, BreadcrumbState, MouseEvent>;
type Adapter = BreadcrumbAdapter<BreadcrumbProps, BreadcrumbState, MouseEvent>;
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

// stands for the ellipsis area in the list of what is shown
const MORE = Symbol('more');

const isRenderable = (node: unknown) => node != null && typeof node !== 'boolean' && node !== '';

export default function Breadcrumb(rawProps: BreadcrumbProps) {
    const props = useDefaultProps('Breadcrumb', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['activeIndex', 'aria-label', 'autoCollapse', 'children', 'class', 'compact', 'maxItemCount', 'moreType', 'onClick', 'ref', 'renderIcon', 'renderItem', 'renderMore', 'routes', 'separator', 'showTooltip']);

    const localeResult = useLocale('Breadcrumb');

    let navElement: HTMLElement | undefined;

    const { foundation, state } = useFoundation<Foundation, Adapter, BreadcrumbProps, BreadcrumbState>(
        BreadcrumbFoundation,
        props,
        () => ({ isCollapsed: true }),
        (base) => ({
            notifyClick: (info, e) => base.getProps().onClick?.(info, e),
            expandCollapsed: () => base.setState({ isCollapsed: false }),
        })
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
        onClick: (info, e) => foundation.handleClick(info, e),
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

    const entries = (): unknown[] => routeEntries() ?? childEntries();

    const range = createMemo(() => BreadcrumbFoundation.getCollapseRange(entries().length, local.maxItemCount, local.activeIndex), undefined, { equals: (a, b) => a.start === b.start && a.end === b.end });

    // Expanding removes the more button, which held focus: the first item it hid takes over, else the nav itself
    const handoverFocus = useFocusHandover<HTMLSpanElement>(() => {
        const target = navElement?.children[range().start]?.querySelector<HTMLElement>('a[href], [tabindex]:not([tabindex="-1"])');
        if (target) {
            return target;
        }
        if (navElement) {
            navElement.tabIndex = -1;
        }
        return navElement;
    });

    const shouldCollapse = () => local.autoCollapse && range().end >= range().start && state().isCollapsed;

    const visible = createMemo((): unknown[] => {
        const all = entries();
        return shouldCollapse() ? [...all.slice(0, range().start), MORE, ...all.slice(range().end + 1)] : all;
    });

    const hasRenderMore = () => typeof local.renderMore === 'function';

    const restEntries = () => entries().slice(range().start, range().end + 1);

    // data only: the props of an Item hold its children and icon as getters, read where renderMore shows them
    const restItems = createMemo(() =>
        restEntries().map((entry): RouteProps | BreadcrumbItemProps => {
            if (routeEntries()) {
                return (entry as RouteEntry)._origin;
            }
            return isToken<BreadcrumbItemProps>(entry, BREADCRUMB_ITEM) ? entry.props : { children: entry as JSX.Element };
        })
    );

    const hasSeparator = (index: number) => BreadcrumbFoundation.shouldRenderSeparator(index, entries().length, { collapsed: shouldCollapse(), ...range(), hasCustomMore: hasRenderMore(), moreType: local.moreType });

    const isActive = (index: number) => BreadcrumbFoundation.isActive(index, entries().length, local.activeIndex);

    const routeContent = (route: RouteEntry) => {
        const render = renderItem();
        return render ? render(route._origin) : route.name;
    };

    function renderEntry(entry: unknown) {
        const index = () => entries().indexOf(entry);
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
        return entry as JSX.Element;
    }

    const moreArea = () => (
        <span ref={handoverFocus} class={`${clsPrefix}-collapse`}>
            <span class={`${clsPrefix}-item-wrap`}>
                <span class={`${clsPrefix}-item ${clsPrefix}-item-more`} aria-label={localeResult().locale.expand} role="button" tabIndex={0} onClick={(e) => foundation.handleExpand(e)} onKeyDown={(e) => foundation.handleExpandKeyDown(e)}>
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
                                    <For each={restEntries()}>
                                        {(entry, i) => (
                                            <>
                                                {renderEntry(entry)}
                                                <Show when={i() !== restEntries().length - 1}>
                                                    <span class={`${clsPrefix}-restItem`}>{local.separator}</span>
                                                </Show>
                                            </>
                                        )}
                                    </For>
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
        </span>
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
                <For each={visible()}>
                    {(entry) => (
                        <Show when={entry !== MORE} fallback={moreArea()}>
                            {renderEntry(entry)}
                        </Show>
                    )}
                </For>
            </nav>
        </BreadContext.Provider>
    );
}
