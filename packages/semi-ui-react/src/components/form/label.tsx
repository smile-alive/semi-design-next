import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
import '@fibrae/semi-foundation/components/form/form.scss';
import { IconHelpCircle } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../../base/index';
import { hasContent } from '../../utils/index';
import useLocale from '../locale/use-locale';
import Tooltip from '../tooltip';

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
    /** Shown in a Tooltip by a help button beside the label; the button is not part of the field's name */
    tooltip?: React.ReactNode;
    optional?: boolean;
    /** Attached to the label element */
    ref?: React.Ref<HTMLLabelElement>;
}

function OptionalText() {
    const { locale } = useLocale('Form');

    return <span className={`${prefixCls}-field-label-optional-text`}>{locale.optional}</span>;
}

function Label({ children, required = false, text, disabled, name, width, align = 'left', style, className = '', extra, tooltip, id, optional = false, ref, htmlFor, ...rest }: LabelProps) {
    const { locale } = useLocale('Form');

    const hasTooltip = hasContent(tooltip);

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

    const labelElement = (
        <label {...rest} ref={ref} id={id} htmlFor={name || htmlFor || undefined} className={labelCls} style={hasTooltip ? style : labelStyle}>
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

    if (!hasTooltip) {
        return labelElement;
    }

    return (
        <div className={`${prefixCls}-field-label-with-tooltip`} style={width ? { width } : undefined}>
            {labelElement}
            <Tooltip content={tooltip}>
                <button type="button" className={`${prefixCls}-field-label-tooltip`} aria-label={locale.labelTooltip}>
                    <IconHelpCircle size="inherit" />
                </button>
            </Tooltip>
        </div>
    );
}

export default memo(Label);
