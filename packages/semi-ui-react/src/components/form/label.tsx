import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
import '@fibrae/semi-foundation/components/form/form.scss';
import type { ElementProps } from '../../base/base';
import useLocale from '../locale/use-locale';

const prefixCls = cssClasses.PREFIX;

export interface LabelProps extends ElementProps<'label'> {
    align?: string;
    className?: string;
    children?: React.ReactNode;
    disabled?: boolean;
    id?: string;
    required?: boolean;
    text?: React.ReactNode;
    name?: string;
    width?: number | string;
    style?: React.CSSProperties;
    extra?: React.ReactNode;
    optional?: boolean;
    /** Attached to the label element */
    ref?: React.Ref<HTMLLabelElement>;
}

function OptionalText() {
    const { locale } = useLocale('Form');

    return <span className={`${prefixCls}-field-label-optional-text`}>{locale.optional}</span>;
}

function Label({ children, required = false, text, disabled, name, width, align = 'left', style, className = '', extra, id, optional = false, ref, htmlFor, ...rest }: LabelProps) {
    const labelCls = clsx(className, {
        [`${prefixCls}-field-label`]: true,
        [`${prefixCls}-field-label-left`]: align === 'left',
        [`${prefixCls}-field-label-right`]: align === 'right',
        [`${prefixCls}-field-label-required`]: required && !optional,
        [`${prefixCls}-field-label-disabled`]: disabled,
        [`${prefixCls}-field-label-with-extra`]: extra,
    });

    const labelStyle = width ? { ...style, width } : style;

    const textContent = (
        <div className={`${prefixCls}-field-label-text`} x-semi-prop="label">
            {typeof text !== 'undefined' ? text : children}
            {optional && <OptionalText />}
        </div>
    );

    return (
        <label {...rest} ref={ref} id={id} htmlFor={name || htmlFor || undefined} className={labelCls} style={labelStyle}>
            {extra ? (
                <>
                    {textContent}
                    <div className={`${prefixCls}-field-label-extra`}>{extra}</div>
                </>
            ) : (
                textContent
            )}
        </label>
    );
}

export default memo(Label);
