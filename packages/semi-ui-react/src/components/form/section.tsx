import type React from 'react';
import { memo, useId } from 'react';
import clsx from 'clsx';
import { cssClasses, type FormSectionPart } from '@fibrae/semi-foundation/components/form/constants';
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
    classNames?: Partial<Record<FormSectionPart, string>>;
    styles?: Partial<Record<FormSectionPart, React.CSSProperties>>;
    /** Attached to the fieldset element */
    ref?: React.Ref<HTMLFieldSetElement>;
}

function Section({ text, extraText, className, classNames, style, styles, children, ref, ...rest }: SectionProps) {
    const extraId = useId();

    const hasExtra = hasContent(extraText);

    return (
        <fieldset {...rest} ref={ref} className={clsx(prefix + '-section', className)} style={style} aria-describedby={joinIds(rest['aria-describedby'], hasExtra && extraId)}>
            {(text || text === 0) && (
                <legend className={clsx(prefix + '-section-text', classNames?.title)} style={styles?.title}>
                    {text}
                </legend>
            )}
            {hasExtra && (
                <div id={extraId} className={clsx(prefix + '-section-extra', classNames?.extra)} style={styles?.extra}>
                    {extraText}
                </div>
            )}
            {children}
        </fieldset>
    );
}

export default memo(Section);
