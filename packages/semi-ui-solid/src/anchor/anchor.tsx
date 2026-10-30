import { createEffect, createMemo, createSignal, on, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-foundation/anchor/constants';
import AnchorFoundation, { type AnchorAdapter } from '@fibrae/semi-foundation/anchor/foundation';
import { findAnchorTarget } from '@fibrae/semi-foundation/anchor/utils';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import shallowEqualObjects from '@fibrae/semi-foundation/utils/shallow-equal-objects';
import '@fibrae/semi-foundation/anchor/anchor.scss';
import mergeRefs from '../_base/merge-refs';
import mergeStyles from '../_base/merge-styles';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useResizeObserver from '../_base/use-resize-observer';
import useLocale from '../locale/use-locale';
import { AnchorContext, type AnchorView } from './context';
import type { AnchorClickEvent, AnchorProps, AnchorState } from './interface';
import { Entries } from './link-item';
import { collectEntries, toAnchorNodes } from './tree';

const prefixCls = cssClasses.PREFIX;

type Foundation = AnchorFoundation<AnchorProps, AnchorState, AnchorClickEvent>;
type Adapter = AnchorAdapter<AnchorProps, AnchorState, AnchorClickEvent>;

const defaultProps = {
    size: 'default',
    railTheme: 'primary',
    scrollMotion: false,
    autoCollapse: false,
    offsetTop: 0,
    targetOffset: 0,
    showTooltip: false,
    maxWidth: strings.MAX_WIDTH,
    maxHeight: strings.MAX_HEIGHT,
    getContainer: () => window,
    defaultAnchor: '',
} satisfies Partial<AnchorProps>;

export default function Anchor(rawProps: AnchorProps) {
    const props = useDefaultProps('Anchor', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['autoCollapse', 'children', 'class', 'defaultAnchor', 'getContainer', 'maxHeight', 'maxWidth', 'offsetTop', 'onChange', 'onClick', 'position', 'railTheme', 'ref', 'scrollIntoViewOptions', 'scrollMotion', 'showTooltip', 'size', 'style', 'targetOffset']);

    const locale = useLocale('Anchor');

    let root: HTMLDivElement | undefined;
    const [linkWrapper, setLinkWrapper] = createSignal<HTMLDivElement>();

    const { foundation, state } = useFoundation<Foundation, Adapter, AnchorProps, AnchorState>(
        AnchorFoundation,
        props,
        () => ({ activeLink: '', links: [], clickLink: false, slideBarTop: '0' }),
        (base) => ({
            getContainer: () => props.getContainer() || window,
            getAnchorNode: (selector) => root?.querySelector<HTMLElement>(selector) ?? null,
            getContentNode: (link) => findAnchorTarget(root, link),
            notifyChange: (currentLink, previousLink) => base.getProps().onChange?.(currentLink, previousLink),
            notifyClick: (e, link) => base.getProps().onClick?.(e, link),
        })
    );

    const entries = collectEntries(createMemo(() => local.children));
    const childMap = createMemo(() => AnchorFoundation.getChildMap(toAnchorNodes(entries())));

    const view = createMemo(
        (): AnchorView => ({
            activeLink: state().activeLink,
            autoCollapse: local.autoCollapse,
            childMap: childMap(),
            position: local.position,
            showTooltip: local.showTooltip,
            size: local.size,
        }),
        undefined,
        { equals: shallowEqualObjects }
    );

    const rootStyle = () => mergeStyles(local.style, { 'max-width': toCssLength(local.maxWidth), 'max-height': toCssLength(local.maxHeight) });

    // getContainer runs inside the effect, so a signal it reads moves the scroll listeners
    createEffect(foundation.handleContainerChange);

    // links above the active one can move it without the active link changing
    createEffect(
        on([entries, () => state().links, () => state().activeLink], () => {
            foundation.syncSlideBar();
        })
    );

    // a narrower container wraps link titles, which moves the active link without any commit
    useResizeObserver(linkWrapper, foundation.syncSlideBar);

    return (
        <AnchorContext.Provider value={{ view, onClick: foundation.handleClick, addLink: foundation.addLink, removeLink: foundation.removeLink }}>
            <div
                {...rest}
                // the Provider's children memo tracks this read; a spread signal object would rebuild every link
                ref={untrack(() => mergeRefs(local.ref, (node: HTMLDivElement) => (root = node)))}
                class={clsx(prefixCls, local.class, `${prefixCls}-size-${local.size}`)}
                style={rootStyle()}
                aria-label={rest['aria-label'] || locale().locale.label}
                role="navigation"
            >
                <div class={`${prefixCls}-rail-wrapper`}>
                    <div class={clsx(`${prefixCls}-slide`, `${prefixCls}-slide-${local.railTheme}`)} aria-hidden="true">
                        <span
                            class={clsx(`${prefixCls}-slide-bar`, `${prefixCls}-slide-bar-${local.size}`, `${prefixCls}-slide-bar-${local.railTheme}`, {
                                [`${prefixCls}-slide-bar-active`]: state().activeLink,
                            })}
                            style={{ top: state().slideBarTop }}
                        />
                    </div>
                    <div ref={setLinkWrapper} class={`${prefixCls}-link-wrapper`} role="list">
                        <Entries entries={entries()} level={1} />
                    </div>
                </div>
            </div>
        </AnchorContext.Provider>
    );
}
