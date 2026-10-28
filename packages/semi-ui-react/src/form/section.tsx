import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/form/constants';
import type { ElementProps } from '../_base/base';

const prefix = cssClasses.PREFIX;

export interface SectionProps extends ElementProps<'section'> {
    className?: string;
    style?: React.CSSProperties;
    text?: React.ReactNode;
    children?: React.ReactNode;
    /** Attached to the section element */
    ref?: React.Ref<HTMLElement>;
}

function Section({ text, className, style, children, ref, ...rest }: SectionProps) {
    return (
        <section {...rest} ref={ref} className={clsx(prefix + '-section', className)} style={style}>
            {(text || text === 0) && <h5 className={prefix + '-section-text'}>{text}</h5>}
            {children}
        </section>
    );
}

export default memo(Section);
