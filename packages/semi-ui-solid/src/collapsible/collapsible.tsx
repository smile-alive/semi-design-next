import { type JSX, createComputed, createMemo, createSignal, on, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/collapsible/constants';
import CollapsibleFoundation, { type CollapsibleAdapter, type CollapsibleBaseProps, type CollapsibleFoundationProps } from '@fibrae/semi-foundation/collapsible/foundation';
import '@fibrae/semi-foundation/collapsible/collapsible.scss';
import callHandler from '../_base/call-handler';
import type { ElementProps } from '../_base/element-props';
import mergeRefs from '../_base/merge-refs';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';

export interface CollapsibleProps extends Omit<CollapsibleFoundationProps, 'className'>, ElementProps<'div'> {
    motion?: boolean;
    children?: JSX.Element;
    isOpen?: boolean;
    duration?: number;
    keepDOM?: boolean;
    lazyRender?: boolean;
    class?: string;
    collapseHeight?: number;
    collapseHeightAdaptive?: boolean;
    /** Goes to the inner content div; the wrapper keeps the other undeclared attributes */
    id?: string;
    onMotionEnd?: () => void;
}

type Foundation = CollapsibleFoundation<CollapsibleBaseProps>;
type Adapter = CollapsibleAdapter<CollapsibleBaseProps>;

const defaultProps = {
    isOpen: false,
    duration: 250,
    motion: true,
    keepDOM: false,
    lazyRender: false,
    collapseHeight: 0,
    collapseHeightAdaptive: false,
    fade: false,
} satisfies Partial<CollapsibleProps>;

const toDeclarations = (style: Record<string, string | number | undefined>) =>
    Object.entries(style)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');

export default function Collapsible(rawProps: CollapsibleProps) {
    const props = useDefaultProps('Collapsible', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['ref', 'children', 'isOpen', 'duration', 'motion', 'keepDOM', 'lazyRender', 'class', 'style', 'collapseHeight', 'collapseHeightAdaptive', 'id', 'onMotionEnd', 'fade', 'onTransitionEnd']);

    // initial value only: later prop changes go through the derivation below
    const [view, setView] = createSignal(CollapsibleFoundation.deriveView(props, CollapsibleFoundation.getInitialView(props)));
    let wrapper: HTMLDivElement | undefined;

    const next = createMemo(() => CollapsibleFoundation.deriveView(props, view()));

    const transitioning = () => CollapsibleFoundation.isInTransition(props, next());

    // Solid writes style keys with setProperty, so the foundation's camelCase transition key needs its CSS name
    const wrapperStyle = () => {
        const { transitionDuration, ...declarations } = CollapsibleFoundation.getWrapperStyle(props, next());
        const own = local.style;
        const style = { ...declarations, 'transition-duration': transitionDuration };
        return typeof own === 'string' ? [toDeclarations(style), own].join('; ') : ({ ...style, ...own } as JSX.CSSProperties);
    };

    // Runs before the DOM updates, so the new height and the transition class land together; written one update later
    // the transition would start at 0ms. The write-back also keeps the `rendered` latch of keepDOM with lazyRender.
    createComputed(on(next, (value) => setView(value)));

    const { foundation } = useFoundation<Foundation, Adapter, CollapsibleBaseProps, object>(
        CollapsibleFoundation,
        props,
        () => ({}),
        () => ({
            setVisible: (visible) => {
                if (next().visible !== visible) setView({ ...next(), visible });
            },
            setIsTransitioning: (isTransitioning) => {
                if (next().isTransitioning !== isTransitioning) setView({ ...next(), isTransitioning });
            },
            notifyMotionEnd: () => local.onMotionEnd?.(),
            getWrapper: () => wrapper ?? null,
        })
    );

    const handleTransitionEnd = (event: TransitionEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onTransitionEnd, event);
        foundation.handleTransitionEnd({ isSelf: event.target === event.currentTarget, propertyName: event.propertyName });
    };

    useWatch(() => local.isOpen, foundation.handleOpenChange);

    return (
        <div {...rest} ref={mergeRefs(local.ref, (node: HTMLDivElement) => (wrapper = node))} class={clsx(`${cssClasses.PREFIX}-wrapper`, { [`${cssClasses.PREFIX}-transition`]: transitioning() }, local.class)} style={wrapperStyle()} onTransitionEnd={handleTransitionEnd}>
            <div
                id={local.id}
                style={{ overflow: 'hidden' }}
                // with collapseHeight > 0 a preview stays visible, so the content is not inert
                inert={!local.isOpen && local.collapseHeight === 0}
                x-semi-prop="children"
            >
                <Show when={CollapsibleFoundation.shouldRender(props, next())}>{local.children}</Show>
            </div>
        </div>
    );
}
