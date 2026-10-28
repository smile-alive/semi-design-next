import type React from 'react';
import { useEffect, useMemo, useRef } from 'react';
import clsx from 'clsx';
import { throttle } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/backtop/constants';
import BackTopFoundation, { type BackTopAdapter, type Target } from '@fibrae/semi-foundation/backtop/foundation';
import '@fibrae/semi-foundation/backtop/backtop.scss';
import { IconBackTop } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import useMergedRef from '../_base/use-merged-ref';
import { hasContent } from '../_utils';
import FloatButton from '../float-button';
import type { FloatButtonProps } from '../float-button/interface';
import useLocale from '../locale/use-locale';

const prefixCls = cssClasses.PREFIX;

function getDefaultTarget() {
    return window;
}

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

export interface BackTopState {
    visible?: boolean;
}

const defaultProps = {
    visibilityHeight: 400,
    target: getDefaultTarget,
    duration: 450,
} satisfies Partial<BackTopProps>;

export default function BackTop(rawProps: BackTopProps) {
    const props = useDefaultProps('BackTop', rawProps, defaultProps);
    const { ref, children, icon, className, style, onClick, visibilityHeight, target, duration, 'aria-label': ariaLabel, ...rest } = props;

    const { locale } = useLocale('BackTop');

    const buttonRef = useRef<HTMLButtonElement>(null);

    const [foundation, state] = useFoundation<BackTopFoundation<BackTopProps, BackTopState, React.MouseEvent>, BackTopAdapter<BackTopProps, BackTopState, React.MouseEvent>, BackTopProps, BackTopState>(
        BackTopFoundation,
        props,
        () => ({ visible: false }),
        (base) => ({
            updateVisible: (visible) => base.setState({ visible }),
            notifyClick: (e) => base.getProps().onClick?.(e),
        })
    );

    const handleClick = useMemo(() => throttle((e: React.MouseEvent) => foundation.onClick(e), duration), [foundation, duration]);
    const mergedRef = useMergedRef(ref, buttonRef);
    const hasChildren = hasContent(children);

    // init runs in the layout phase, when refs to a parent or a later sibling are still null
    useEffect(() => {
        foundation.handleTargetChange();
    }, [foundation]);

    useDidUpdate(props.target, () => foundation.handleTargetChange());
    useEffect(() => () => handleClick.cancel(), [handleClick]);

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
            onClick={handleClick}
        />
    );
}
