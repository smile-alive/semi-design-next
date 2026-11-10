import type React from 'react';
import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses, numbers } from '@fibrae/semi-foundation/components/backtop/constants';
import BackTopFoundation, { type BackTopAdapter, type BackTopState, type Target } from '@fibrae/semi-foundation/components/backtop/foundation';
import '@fibrae/semi-foundation/components/backtop/backtop.scss';
import { IconBackTop } from '@fibrae/semi-icons-react';
import { type ElementProps, useDefaultProps, useFoundation } from '../../base/index';
import { useMergedRef } from '../../hooks/index';
import { hasContent } from '../../utils/index';
import FloatButton from '../float-button';
import type { FloatButtonProps } from '../float-button/interface';
import useLocale from '../locale/use-locale';

type Foundation = BackTopFoundation<BackTopProps, React.MouseEvent>;
type Adapter = BackTopAdapter<BackTopProps, React.MouseEvent>;

const prefixCls = cssClasses.PREFIX;

export interface BackTopProps extends ElementProps<'button', 'onClick' | 'type' | 'form' | 'formAction' | 'formEncType' | 'formMethod' | 'formNoValidate' | 'formTarget'>, Pick<FloatButtonProps, 'icon' | 'shape' | 'size' | 'colorful' | 'badge'> {
    target?: () => Target | null;
    visibilityHeight?: number;
    duration?: number;
    onClick?: (e: React.MouseEvent) => void;
    style?: React.CSSProperties;
    className?: string;
    /** Static content of the button, shown in place of `icon`; must not contain interactive elements */
    children?: React.ReactNode;
    /** Accessible name of the button, needed whenever it shows only an icon */
    'aria-label'?: string;
    /** Attached to the native button, which exists only while it is visible */
    ref?: React.Ref<HTMLButtonElement>;
}

export type { BackTopState };

const defaultProps = {
    visibilityHeight: numbers.DEFAULT_VISIBILITY_HEIGHT,
    duration: numbers.DEFAULT_DURATION,
} satisfies Partial<BackTopProps>;

export default function BackTop(rawProps: BackTopProps) {
    const props = useDefaultProps('BackTop', rawProps, defaultProps);
    const { ref, children, icon, className, style, onClick, visibilityHeight, target, duration, 'aria-label': ariaLabel, ...rest } = props;

    const { locale } = useLocale('BackTop');

    const buttonRef = useRef<HTMLButtonElement>(null);

    const [foundation, state] = useFoundation<Foundation, Adapter, BackTopProps, BackTopState>(
        BackTopFoundation,
        props,
        () => BackTopFoundation.getInitialState(),
        (base) => ({
            notifyClick: (e) => base.getProps().onClick?.(e),
        })
    );

    const mergedRef = useMergedRef(ref, buttonRef);
    const hasChildren = hasContent(children);

    // init runs in the layout phase, when refs to a parent or a later sibling are still null
    useEffect(() => {
        foundation.handleTargetChange();
    }, [foundation]);

    useEffect(() => {
        if (hasContent(children)) {
            BackTopFoundation.warnInteractiveChildren(buttonRef.current);
        }
    }, [children, state.visible]);

    if (!state.visible) {
        return null;
    }

    return (
        <FloatButton
            {...rest}
            ref={mergedRef}
            className={clsx(prefixCls, className)}
            style={style}
            // static children are the visible name; a different default would contradict them
            aria-label={ariaLabel ?? (hasChildren ? undefined : locale.backToTop)}
            x-semi-prop="children"
            icon={hasChildren ? children : (icon ?? <IconBackTop />)}
            onClick={foundation.onClick}
        />
    );
}
