import type React from 'react';
import { useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/button/constants';
import { markEnds } from '@fibrae/semi-foundation/components/button/utils';
import '@fibrae/semi-foundation/components/button/button.scss';
import { type ElementProps, type BaseProps, useDefaultProps } from '../../base/index';
import { useMergedRef } from '../../hooks/index';

const prefixCls = cssClasses.PREFIX;

export interface SplitButtonGroupProps extends BaseProps, ElementProps<'div'> {
    'aria-label'?: React.AriaAttributes['aria-label'];
    /** Ref of the root div */
    ref?: React.Ref<HTMLDivElement>;
}

export default function SplitButtonGroup(rawProps: SplitButtonGroupProps) {
    const { ref, children, style, className, ...rest } = useDefaultProps('SplitButtonGroup', rawProps, {});

    const containerRef = useRef<HTMLDivElement>(null);

    const mergedRef = useMergedRef(ref, containerRef);

    useLayoutEffect(() => {
        const container = containerRef.current;
        markEnds(container);
        const observer = new MutationObserver((mutations) => {
            const changed = mutations.some((mutation) => mutation.type === 'childList' || (mutation.type === 'attributes' && mutation.attributeName === 'class'));
            if (changed) {
                markEnds(container);
            }
        });
        observer.observe(container, { attributes: true, childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);

    return (
        <div {...rest} ref={mergedRef} className={clsx(`${prefixCls}-split`, className)} style={style} role="group">
            {children}
        </div>
    );
}
