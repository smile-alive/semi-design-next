import type React from 'react';
import { useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/button/constants';
import { markEnds } from '@fibrae/semi-foundation/button/utils';
import '@fibrae/semi-foundation/button/button.scss';
import type { ElementProps } from '../_base/base';
import type { BaseProps } from '../_base/base-component';
import useDefaultProps from '../_base/use-default-props';
import useMergedRef from '../_base/use-merged-ref';

const prefixCls = cssClasses.PREFIX;

export interface SplitButtonGroupProps extends BaseProps, ElementProps<'div'> {
    'aria-label'?: React.AriaAttributes['aria-label'];
    /** Ref of the root div */
    ref?: React.Ref<HTMLDivElement>;
}

export default function SplitButtonGroup(rawProps: SplitButtonGroupProps) {
    const props = useDefaultProps('SplitButtonGroup', rawProps, {});
    const { ref, children, style, className, ...rest } = props;

    const containerRef = useRef<HTMLDivElement>(null);

    const mergedRef = useMergedRef(ref, containerRef);

    useLayoutEffect(() => {
        const container = containerRef.current;
        markEnds(container);
        // a re-render can replace a button's className, so mark again whenever classes or buttons change
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
