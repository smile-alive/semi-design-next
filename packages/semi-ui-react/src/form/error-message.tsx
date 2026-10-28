import React, { memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/form/constants';
import type { BasicFieldError } from '@fibrae/semi-foundation/form/interface';
import { IconAlertTriangle, IconAlertCircle } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../_base/base';

const prefix = cssClasses.PREFIX;

export type ReactFieldError = BasicFieldError | React.ReactNode;

export interface ErrorMessageProps extends ElementProps<'div'> {
    error?: ReactFieldError;
    className?: string;
    style?: React.CSSProperties;
    showValidateIcon?: boolean;
    validateStatus?: string;
    helpText?: React.ReactNode;
    isInInputGroup?: boolean;
    errorMessageId?: string;
    helpTextId?: string;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

/** Whether an error has content ErrorMessage renders; a number or a boolean does not */
export function hasErrorContent(error: ReactFieldError) {
    if (Array.isArray(error)) {
        return error.some(Boolean);
    }
    return (typeof error === 'string' && error !== '') || React.isValidElement(error);
}

// the span id is the target of aria-errormessage and aria-describedby
function generatorText(content: ReactFieldError, id: string) {
    if (!hasErrorContent(content)) {
        return null;
    }
    if (Array.isArray(content)) {
        return (
            <span id={id}>
                {content.filter(Boolean).map((item: React.ReactNode, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && ', '}
                        {item}
                    </React.Fragment>
                ))}
            </span>
        );
    }
    return <span id={id}>{content}</span>;
}

function ErrorMessage({ error, className, style, validateStatus, helpText, showValidateIcon, isInInputGroup, errorMessageId, helpTextId, ref, ...rest }: ErrorMessageProps) {
    const cls = clsx(
        {
            [prefix + '-field-error-message']: Boolean(error),
            [prefix + '-field-help-text']: Boolean(helpText),
        },
        className
    );

    if (!error && !helpText) {
        return null;
    }

    // async-validator's `message: ''` means "failed, hide the text"; helpText would look like success
    if (error === '' && validateStatus === 'error') {
        return null;
    }

    const id = error ? errorMessageId : helpTextId;
    const text = generatorText(error ? error : helpText, id);

    // only an array error without content (e.g. InputGroup collecting [false, false]) renders nothing
    if (Array.isArray(error) && !text && !helpText) {
        return null;
    }

    let icon = null;

    const iconCls = `${prefix}-field-validate-status-icon`;

    if (isInInputGroup || validateStatus === 'error') {
        icon = <IconAlertCircle className={iconCls} />;
    } else if (validateStatus === 'warning') {
        icon = <IconAlertTriangle className={iconCls} />;
    }

    return (
        <div {...rest} ref={ref} className={cls} style={style}>
            {showValidateIcon && text && icon}
            {text}
        </div>
    );
}

export default memo(ErrorMessage);
