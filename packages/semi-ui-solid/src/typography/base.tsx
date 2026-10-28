import { type Component, type JSX, Match, Show, Switch, type ValidComponent, children, createEffect, createMemo, createSignal, mergeProps, onCleanup, splitProps, untrack } from 'solid-js';
import { Dynamic, isServer } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/typography/constants';
import { EllipsisRuntime, canUseCSSEllipsis, getEllipsisOpt, getRenderText, isInsideWidgetItem, isOverflowing } from '@fibrae/semi-foundation/typography/ellipsis';
import warning from '@fibrae/semi-foundation/utils/warning';
import callHandler from '../_base/call-handler';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import mergeStyles from '../_base/merge-styles';
import useResizeObserver from '../_base/use-resize-observer';
import useLocale from '../locale/use-locale';
import Popover from '../popover';
import Tooltip, { type GetTriggerProps, type TriggerOwnProps } from '../tooltip';
import { useTooltipDescription } from '../tooltip/context';
import { SizeContext, useSizeContext } from './context';
import Copyable from './copyable';
import type { Ellipsis, LinkType, OmitTypographyProps, ShowTooltip, TypographyBaseSize, TypographyCommonProps, TypographyEllipsisProps, TypographyIcon } from './interface';
import { TypographyElement } from './typography';

export interface BaseTypographyProps extends ElementProps<'article', OmitTypographyProps | 'ref'>, TypographyCommonProps, TypographyEllipsisProps {
    icon?: TypographyIcon;
    size?: TypographyBaseSize;
    code?: boolean;
    spacing?: string;
    /** Title's tag, which also picks the heading class */
    headingTag?: `h${1 | 2 | 3 | 4 | 5 | 6}`;
    weight?: string | number;
    tabIndex?: number;
    /** A method, so the ref of Text, Title and Paragraph (a more specific element type) is accepted */
    ref?(element: HTMLElement): void;
    'data-popupid'?: string;
}

/** Ellipsis state; `source` is the text it was derived from, a view of another text is stale */
interface EllipsisView {
    source: string;
    isOverflowed: boolean;
    ellipsisContent: string;
    expanded: boolean;
    isTruncated: boolean;
}

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    type: 'primary',
    spacing: 'normal',
    disabled: false,
    ellipsis: false,
    size: 'normal',
    link: false,
    copyable: false,
    strong: false,
    mark: false,
    underline: false,
    delete: false,
} satisfies Partial<BaseTypographyProps>;

// The Tooltip's description lands here when the root opts out of it, so a focused link announces the full text
function DescribedAnchor(props: JSX.AnchorHTMLAttributes<HTMLAnchorElement>) {
    const [local, rest] = splitProps(props, ['children']);

    const description = useTooltipDescription();

    return (
        <a {...rest} aria-describedby={rest['aria-describedby'] ?? description?.()}>
            {local.children}
        </a>
    );
}

// Wraps its children in `tag` while `when` holds; a nested chain of these keeps a decoration that did not change in place
function Layer(props: { when: unknown; tag: ValidComponent; attrs?: object; children: JSX.Element }) {
    return (
        <Show when={props.when} fallback={props.children}>
            <Dynamic {...props.attrs} component={props.tag}>
                {props.children}
            </Dynamic>
        </Show>
    );
}

function getTooltipConfig({ showTooltip, expandable, expandText }: Pick<Ellipsis, 'showTooltip' | 'expandable' | 'expandText'>): ShowTooltip | undefined {
    const noExpandText = !expandable && expandText === undefined;
    if (!(noExpandText && showTooltip)) {
        return undefined;
    }
    if (typeof showTooltip !== 'object') {
        return { type: 'tooltip' };
    }
    if (showTooltip.type?.toLowerCase() === 'popover') {
        return {
            ...showTooltip,
            opts: {
                showArrow: true,
                ...showTooltip.opts,
                class: clsx(`${prefixCls}-ellipsis-popover`, showTooltip.opts?.class),
            },
        };
    }
    return { type: 'tooltip', ...showTooltip };
}

// Resolved children as the text JS truncation and copying work on; an element contributes its text
function plainText(nodes: unknown[]) {
    // on the server the text only feeds the popup and the copy content, which render in the browser
    return nodes.map((node) => (typeof node === 'string' || typeof node === 'number' ? String(node) : !isServer && node instanceof Node ? node.textContent : '')).join('');
}

function linkAttrs(link: LinkType, disabled: boolean, clickable: boolean): object {
    const config = typeof link === 'object' ? link : undefined;
    // a disabled link keeps its look only; handlers, href and target must not reach the span
    if (disabled) {
        return { class: config?.class, style: config?.style };
    }
    // an anchor without href is neither focusable nor a link, so a clickable one is made so by hand
    if (!config?.href && (clickable || config?.onClick)) {
        const onKeyDown = config?.onKeyDown;
        return {
            role: 'link',
            tabIndex: 0,
            ...config,
            onKeyDown: (e: KeyboardEvent & { currentTarget: HTMLAnchorElement; target: Element }) => {
                callHandler(onKeyDown, e);
                if (!e.defaultPrevented && e.key === 'Enter' && e.target === e.currentTarget) {
                    e.currentTarget.click();
                }
            },
        };
    }
    return { ...config };
}

function BaseContent(props: BaseTypographyProps & Required<Pick<BaseTypographyProps, keyof typeof defaultProps>>) {
    const [local, attrs] = splitProps(props, ['ref', 'component', 'children', 'class', 'type', 'spacing', 'disabled', 'style', 'ellipsis', 'icon', 'size', 'link', 'headingTag', 'weight', 'tabIndex', 'copyable', 'strong', 'mark', 'underline', 'code', 'delete']);

    // the attributes a Tooltip trigger merges instead of just passing on
    const [own, rest] = splitProps(attrs, ['aria-describedby', 'aria-expanded', 'aria-haspopup', 'aria-controls', 'data-popupid', 'tabindex']);

    const realSize = useSizeContext();
    const locale = useLocale('Typography');

    const [root, setRoot] = createSignal<HTMLElement>();
    const [parent, setParent] = createSignal<HTMLElement>();
    const [stored, setStored] = createSignal<EllipsisView>();
    const [insideWidgetItem, setInsideWidgetItem] = createSignal(false);
    let expandElement: HTMLButtonElement | undefined;
    let copyElement: HTMLSpanElement | undefined;
    const runtime = new EllipsisRuntime();
    const widths = new WeakMap<Element, number>();

    // a memo, so a new ellipsis object does not reconnect the runtime and cancel its pending measurement
    const hasEllipsis = createMemo(() => Boolean(local.ellipsis));

    // Adding or removing a wrapper moves the content nodes, and the list that held them removes them again on
    // reconcile, so each set of wrappers gets new children, as React remounts the subtree when the wrapper element
    // changes. Truncating and expanding keep the wrappers and the nodes.
    const wrappers = createMemo(() => [Boolean(local.link), local.delete, local.strong, local.underline && !local.link, local.code, local.mark, hasEllipsis()].join());

    const resolved = children(() => {
        wrappers();
        return local.children;
    });

    const iconResolved = children(() => local.icon as JSX.Element);
    const text = createMemo(() => plainText(resolved.toArray()));
    const opt = createMemo(() => getEllipsisOpt(local.ellipsis, locale().locale.expand, locale().locale.collapse));
    const rows = createMemo(() => opt().rows);
    const pos = createMemo(() => opt().pos);
    const suffix = createMemo(() => opt().suffix);
    const expandable = createMemo(() => opt().expandable);
    const expandText = createMemo(() => opt().expandText);
    const collapsible = createMemo(() => opt().collapsible);
    const collapseText = createMemo(() => opt().collapseText);

    // read once: an object literal prop is rebuilt on every read
    const copyable = createMemo(() => local.copyable);
    const cssEllipsis = createMemo(() => hasEllipsis() && canUseCSSEllipsis(opt(), copyable()));
    const hasTooltip = createMemo(() => Boolean(opt().showTooltip));
    const hasCopyable = createMemo(() => Boolean(copyable()));
    const strong = createMemo(() => local.strong);

    // isTruncated starts true so the expand button renders and the measurement includes its width
    const view = createMemo<EllipsisView>(() => {
        const current = stored();
        const source = text();
        return current?.source === source ? current : { source, isOverflowed: false, ellipsisContent: source, expanded: false, isTruncated: hasEllipsis() };
    });

    const expanded = createMemo(() => view().expanded);
    const isTruncated = createMemo(() => view().isTruncated);
    const tooltipConfig = createMemo(() => getTooltipConfig(opt()));

    const tooltipKind = createMemo(() => {
        const config = tooltipConfig();
        if (!config) {
            return 'none';
        }
        if (typeof config.renderTooltip === 'function') {
            return 'custom';
        }
        return config.type?.toLowerCase() === 'popover' ? 'popover' : 'tooltip';
    });

    const copyConfig = createMemo(() => {
        const value = copyable();
        const config = typeof value === 'object' ? value : undefined;
        // after the spread, so an explicit `content: undefined` cannot override the fallback
        return { duration: 3, ...config, content: config?.content ?? text() };
    });

    const noExpandText = () => !expandable() && expandText() === undefined;

    const noCollapseText = () => !collapsible() && collapseText() === undefined;

    const update = (patch: Partial<Omit<EllipsisView, 'source'>>) => {
        const previous = view();
        if ((Object.keys(patch) as Array<keyof typeof patch>).every((key) => Object.is(previous[key], patch[key]))) {
            return;
        }
        setStored({ ...previous, ...patch });
    };

    const measure = () => {
        const node = root();
        if (!node) {
            return;
        }
        setInsideWidgetItem(isInsideWidgetItem(node, copyElement));
        if (cssEllipsis()) {
            // a text that switched here from an expandable ellipsis must not stay expanded. Measuring only on hover
            // would leave the first hover without a Tooltip
            update({ isTruncated: false, expanded: false, ...(hasTooltip() && { isOverflowed: isOverflowing(node, rows()) }) });
            return;
        }
        if (!hasContent(resolved())) {
            update({ isTruncated: false, isOverflowed: false });
            return;
        }
        warning(
            resolved.toArray().some((item) => item instanceof Element),
            '[Semi Typography] Only children with pure text could be used with ellipsis at this moment.'
        );
        if (!rows() || rows() < 0 || expanded()) {
            return;
        }
        const content = getRenderText(node, rows(), text(), { expand: expandElement ?? null, copy: copyElement ?? null }, suffix(), pos(), local.strong);
        update({ isOverflowed: false, ellipsisContent: content, isTruncated: text() !== content });
    };

    const onHover = () => {
        const node = root();
        if (cssEllipsis() && node) {
            update({ isOverflowed: isOverflowing(node, rows()), isTruncated: false });
        }
    };

    const toggleOverflow = (event: MouseEvent) => {
        const ellipsis = local.ellipsis;
        if (typeof ellipsis === 'object') {
            ellipsis.onExpand?.(!expanded(), event);
        }
        const element = root();
        // the button disappears once expanded; move focus to the text instead of dropping it to the body
        if (expandable() && !expanded() && noCollapseText() && element) {
            element.tabIndex = -1;
            element.focus();
        }
        if ((expandable() && !expanded()) || (collapsible() && expanded())) {
            update({ expanded: !expanded() });
        }
    };

    const onResize = (entries: ResizeObserverEntry[]) => {
        const changed = entries.filter((entry) => {
            const width = entry.contentRect.width;
            const differs = widths.get(entry.target) !== width;
            widths.set(entry.target, width);
            return differs;
        });
        if (changed.length > 0) {
            runtime.handleResize();
        }
    };

    const expandLabel = () => {
        if (!isTruncated()) {
            return undefined;
        }
        // an explicit undefined in the ellipsis object overrides the default text, so the locale text is the fallback
        if (!expanded() && !noExpandText()) {
            return expandText() ?? locale().locale.expand;
        }
        if (expanded() && !noCollapseText()) {
            return collapseText() ?? locale().locale.collapse;
        }
        return undefined;
    };

    const iconComponent = () => {
        const value = iconResolved();
        return typeof value === 'function' ? (value as Component<{ size?: 'small' | 'default' }>) : undefined;
    };

    const iconNode = () => (
        <Show when={hasContent(iconResolved())}>
            <span class={`${prefixCls}-icon`} x-semi-prop="icon">
                <Show when={iconComponent()} fallback={iconResolved()}>
                    {(component) => <Dynamic component={component()} size={realSize() === 'small' ? 'small' : 'default'} />}
                </Show>
            </span>
        </Show>
    );

    // css truncation applies while not expanded
    const cssActive = () => !expanded() && cssEllipsis();

    const ellipsisCls = () =>
        hasEllipsis()
            ? clsx({
                  [`${prefixCls}-ellipsis`]: true,
                  [`${prefixCls}-ellipsis-single-line`]: rows() === 1,
                  [`${prefixCls}-ellipsis-multiple-line`]: rows() > 1,
                  // Text (span) stays inline
                  [`${prefixCls}-ellipsis-multiple-line-text`]: rows() > 1 && local.component === 'span',
                  [`${prefixCls}-ellipsis-overflow-ellipsis`]: rows() === 1 && cssActive(),
                  [`${prefixCls}-ellipsis-overflow-ellipsis-text`]: rows() === 1 && cssActive() && local.component === 'span',
              })
            : '';

    const wrapperCls = () =>
        clsx(local.class, ellipsisCls(), {
            [`${prefixCls}-${local.type}`]: local.type && !local.link,
            [`${prefixCls}-${realSize()}`]: realSize(),
            [`${prefixCls}-link`]: local.link,
            [`${prefixCls}-disabled`]: local.disabled,
            [`${prefixCls}-${local.spacing}`]: local.spacing,
            [`${prefixCls}-${local.headingTag}`]: local.headingTag,
            [`${prefixCls}-${local.headingTag}-weight-${local.weight}`]: local.headingTag && local.weight && isNaN(Number(local.weight)),
        });

    // the consumer's style overrides the weight but not the clamp the ellipsis needs
    const rootStyle = () => mergeStyles({ 'font-weight': isNaN(Number(local.weight)) ? undefined : local.weight }, local.style, { '-webkit-line-clamp': cssActive() && rows() > 1 ? rows() : undefined });

    const linkCls = () =>
        clsx({
            [`${prefixCls}-link-text`]: local.link,
            [`${prefixCls}-link-underline`]: local.underline && local.link,
        });

    // an uncut text keeps its own nodes, so the first frame of a truncation does not flatten elements into text
    const showFull = () => expanded() || !isTruncated() || view().ellipsisContent === view().source;

    const textNode = () =>
        hasEllipsis() ? (
            <span onMouseEnter={onHover}>
                {showFull() ? resolved() : view().ellipsisContent}
                {suffix()}
            </span>
        ) : (
            resolved()
        );

    const rootContent = () => (
        <>
            <Layer when={local.link} tag={local.disabled ? 'span' : DescribedAnchor} attrs={linkAttrs(local.link, local.disabled, Boolean(rest.onClick))}>
                <Layer when={local.delete} tag="del">
                    <Layer when={local.strong} tag="strong">
                        <Layer when={local.underline && !local.link} tag="u">
                            <Layer when={local.code} tag="code">
                                <Layer when={local.mark} tag="mark">
                                    {iconNode()}
                                    <Show when={local.link} fallback={textNode()}>
                                        <span class={linkCls()}>{textNode()}</span>
                                    </Show>
                                </Layer>
                            </Layer>
                        </Layer>
                    </Layer>
                </Layer>
            </Layer>
            <Show when={expandLabel() !== undefined}>
                <button
                    ref={(element) => {
                        expandElement = element;
                        onCleanup(() => (expandElement = undefined));
                    }}
                    type="button"
                    class={`${prefixCls}-ellipsis-expand`}
                    // only a button that toggles is a disclosure
                    aria-expanded={(expanded() ? collapsible() : expandable()) ? expanded() : undefined}
                    onClick={toggleOverflow}
                >
                    {expandLabel()}
                </button>
            </Show>
            <Show when={hasCopyable()}>
                <Copyable
                    {...copyConfig()}
                    ref={(element) => {
                        copyElement = element;
                        onCleanup(() => (copyElement = undefined));
                    }}
                    onCopiedChange={() => hasEllipsis() && runtime.schedule()}
                />
            </Show>
        </>
    );

    const overflowed = () => !expanded() && (cssEllipsis() ? view().isOverflowed : isTruncated());

    const tooltipEnabled = () => overflowed() && tooltipConfig()?.opts?.condition !== false;

    const focusable = () => local.tabIndex !== undefined || (tooltipEnabled() && !insideWidgetItem());

    // the description goes to the focusable link inside (see DescribedAnchor), unless the caller set their own
    const describedByLink = () => {
        const link = local.link;
        const linkConfig = typeof link === 'object' ? link : {};
        return Boolean(link) && !local.disabled && Boolean(linkConfig.href || linkConfig.onClick || rest.onClick) && !own['aria-describedby'];
    };

    const renderRoot = (trigger?: GetTriggerProps) => {
        const ownProps = mergeProps(own, {
            // renderRoot runs inside Switch and Show memos that would track the ref read; a spread props signal would recreate the root
            ref: untrack(() => mergeRefs<HTMLElement>(local.ref, (element) => setRoot(element))),
            // Tooltip forces tabIndex 0 on its trigger; the text keeps it only when `focusable`
            get tabIndex() {
                return trigger && !focusable() ? null : local.tabIndex;
            },
            get 'aria-describedby'() {
                return trigger && describedByLink() ? null : undefined;
            },
        });
        // null is for the trigger merge only; without a trigger the getters never return it
        const triggerProps = trigger ? trigger(ownProps as TriggerOwnProps) : (ownProps as typeof ownProps & { tabIndex?: number; 'aria-describedby'?: string });
        return (
            <TypographyElement {...rest} {...triggerProps} component={local.component} class={wrapperCls()} style={rootStyle()}>
                {rootContent()}
            </TypographyElement>
        );
    };

    createEffect(() => {
        if (!hasEllipsis()) {
            return;
        }
        runtime.connect(measure);
        onCleanup(() => runtime.disconnect());
    });

    // isTruncated re-measures with the expand button's width
    createEffect(() => {
        text();
        isTruncated();
        expanded();
        rows();
        pos();
        suffix();
        expandText();
        hasTooltip();
        hasCopyable();
        strong();
        if (hasEllipsis()) {
            runtime.schedule();
        }
    });

    // the parent is read once the root is in the document; a ref callback runs before that
    createEffect(() => setParent(hasEllipsis() ? (root()?.parentElement ?? undefined) : undefined));
    useResizeObserver(() => (hasEllipsis() ? root() : undefined), onResize);
    useResizeObserver(parent, onResize);

    // the Tooltip is switched by `condition` so the root is not remounted when the overflow changes
    return (
        <Switch fallback={renderRoot()}>
            <Match when={tooltipKind() === 'custom' && tooltipConfig()}>
                {(config) => (
                    <Show when={overflowed()} fallback={renderRoot()}>
                        {config().renderTooltip?.(text(), renderRoot())}
                    </Show>
                )}
            </Match>
            <Match when={tooltipKind() === 'popover' && tooltipConfig()}>
                {(config) => (
                    <Popover content={text()} position="top" {...config().opts} condition={tooltipEnabled()}>
                        {(getTriggerProps) => renderRoot(getTriggerProps)}
                    </Popover>
                )}
            </Match>
            <Match when={tooltipKind() === 'tooltip' && tooltipConfig()}>
                {(config) => (
                    <Tooltip content={text()} position="top" {...config().opts} condition={tooltipEnabled()}>
                        {(getTriggerProps) => renderRoot(getTriggerProps)}
                    </Tooltip>
                )}
            </Match>
        </Switch>
    );
}

export default function Base(rawProps: BaseTypographyProps) {
    const props = mergeProps(defaultProps, rawProps);

    const contextSize = useSizeContext();

    const size = createMemo(() => (props.size === 'inherit' ? contextSize() : props.size));

    // the content is resolved below this provider, so a Text with size inherit inside reads this size
    return (
        <SizeContext.Provider value={size}>
            <BaseContent {...props} />
        </SizeContext.Provider>
    );
}
