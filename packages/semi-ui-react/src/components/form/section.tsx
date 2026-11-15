import type React from 'react';
import { memo, useId } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
import { joinIds } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/form/form.scss';
import type { ElementProps } from '../../base/index';
import { hasContent } from '../../utils/index';

const prefix = cssClasses.PREFIX;

export interface SectionProps extends ElementProps<'fieldset'> {
    className?: string;
    style?: React.CSSProperties;
    text?: React.ReactNode;
    /** Shown below the title and describes the fieldset */
    extraText?: React.ReactNode;
    children?: React.ReactNode;
    /** Attached to the fieldset element */
    ref?: React.Ref<HTMLFieldSetElement>;
}

function Section({ text, extraText, className, style, children, ref, ...rest }: SectionProps) {
    const extraId = useId();

    const hasExtra = hasContent(extraText);

    return (
        <fieldset {...rest} ref={ref} className={clsx(prefix + '-section', className)} style={style} aria-describedby={joinIds(rest['aria-describedby'], hasExtra && extraId)}>
            {(text || text === 0) && <legend className={prefix + '-section-text'}>{text}</legend>}
            {hasExtra && (
                <div id={extraId} className={prefix + '-section-extra'}>
                    {extraText}
                </div>
            )}
            {children}
        </fieldset>
    );
}

export default memo(Section);
