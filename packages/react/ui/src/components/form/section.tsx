import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
import type { ElementProps } from '../../base/base';

const prefix = cssClasses.PREFIX;

export interface SectionProps extends ElementProps<'fieldset'> {
    className?: string;
    style?: React.CSSProperties;
    text?: React.ReactNode;
    children?: React.ReactNode;
    /** Attached to the fieldset element */
    ref?: React.Ref<HTMLFieldSetElement>;
}

function Section({ text, className, style, children, ref, ...rest }: SectionProps) {
    return (
        <fieldset {...rest} ref={ref} className={clsx(prefix + '-section', className)} style={style}>
            {(text || text === 0) && <legend className={prefix + '-section-text'}>{text}</legend>}
            {children}
        </fieldset>
    );
}

export default memo(Section);
