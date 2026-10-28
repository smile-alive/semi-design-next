import type React from 'react';
import { useRef, useState } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/collapsible/constants';
import CollapsibleFoundation, { type CollapsibleAdapter, type CollapsibleFoundationProps } from '@fibrae/semi-foundation/collapsible/foundation';
import '@fibrae/semi-foundation/collapsible/collapsible.scss';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import useMergedRef from '../_base/use-merged-ref';

export interface CollapsibleProps extends CollapsibleFoundationProps, ElementProps<'div'> {
    motion?: boolean;
    children?: React.ReactNode;
    isOpen?: boolean;
    duration?: number;
    keepDOM?: boolean;
    lazyRender?: boolean;
    className?: string;
    style?: React.CSSProperties;
    collapseHeight?: number;
    collapseHeightAdaptive?: boolean;
    id?: string;
    onMotionEnd?: () => void;
    /** Attached to the wrapper div; `id` goes to the inner content div */
    ref?: React.Ref<HTMLDivElement>;
}

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

export default function Collapsible(rawProps: CollapsibleProps) {
    const props = useDefaultProps('Collapsible', rawProps, defaultProps);
    const { ref, motion, children, isOpen, duration, keepDOM, lazyRender, className, style, collapseHeight, collapseHeightAdaptive, id, onMotionEnd, fade, onTransitionEnd, ...rest } = props;

    // adjusted during render so height and transition land in one commit; a layout effect could skip the animation
    const [view, setView] = useState(() => CollapsibleFoundation.getInitialView(props));
    const wrapperRef = useRef<HTMLDivElement>(null);

    const [foundation] = useFoundation<CollapsibleFoundation<typeof props>, CollapsibleAdapter<typeof props>, typeof props, object>(
        CollapsibleFoundation,
        props,
        () => ({}),
        (base) => ({
            setVisible: (visible) => setView((prev) => (prev.visible === visible ? prev : { ...prev, visible })),
            setIsTransitioning: (isTransitioning) => setView((prev) => (prev.isTransitioning === isTransitioning ? prev : { ...prev, isTransitioning })),
            notifyMotionEnd: () => base.getProps().onMotionEnd?.(),
            getWrapper: () => wrapperRef.current,
        })
    );

    const setWrapperRef = useMergedRef(ref, wrapperRef);
    const next = CollapsibleFoundation.deriveView(props, view);

    if (next !== view) {
        setView(next);
    }

    const transitioning = CollapsibleFoundation.isInTransition(props, next);

    useDidUpdate(isOpen, () => foundation.handleOpenChange());

    return (
        <div
            {...rest}
            ref={setWrapperRef}
            className={clsx(`${cssClasses.PREFIX}-wrapper`, { [`${cssClasses.PREFIX}-transition`]: transitioning }, className)}
            style={{ ...CollapsibleFoundation.getWrapperStyle(props, next), ...style }}
            onTransitionEnd={(e) => {
                onTransitionEnd?.(e);
                foundation.handleTransitionEnd({ isSelf: e.target === e.currentTarget, propertyName: e.propertyName });
            }}
        >
            <div
                id={id}
                style={{ overflow: 'hidden' }}
                // with collapseHeight > 0 a preview stays visible, so the content is not inert
                inert={!isOpen && collapseHeight === 0}
                x-semi-prop="children"
            >
                {CollapsibleFoundation.shouldRender(props, next) && children}
            </div>
        </div>
    );
}
