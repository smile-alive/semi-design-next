import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
import { errorMessages, type FieldError } from '@fibrae/semi-foundation/components/form/errors';
import { IconAlertTriangle, IconAlertCircle } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../../base/base';

const prefix = cssClasses.PREFIX;

export interface ErrorMessageProps extends ElementProps<'div'> {
    /** The messages are joined with `, `; `['']` fails without a text and renders nothing */
    error?: FieldError;
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

function ErrorMessage({ error, className, style, validateStatus, helpText, showValidateIcon, isInInputGroup, errorMessageId, helpTextId, ref, ...rest }: ErrorMessageProps) {
    const messages = errorMessages(error);
    const failed = Boolean(error?.length);

    const cls = clsx(
        {
            [prefix + '-field-error-message']: failed,
            [prefix + '-field-help-text']: Boolean(helpText),
        },
        className
    );

    // the span id is the target of aria-errormessage and aria-describedby
    const text = failed ? <span id={errorMessageId}>{messages.join(', ')}</span> : <span id={helpTextId}>{helpText}</span>;
    const iconCls = `${prefix}-field-validate-status-icon`;
    const icon = isInInputGroup || validateStatus === 'error' ? <IconAlertCircle className={iconCls} /> : validateStatus === 'warning' && <IconAlertTriangle className={iconCls} />;

    // an error without a text (a rule with `message: ''`) hides the helpText too, which would read as a passed check
    if (failed ? !messages.length : !helpText) {
        return null;
    }

    return (
        <div {...rest} ref={ref} className={cls} style={style}>
            {showValidateIcon && icon}
            {text}
        </div>
    );
}

export default memo(ErrorMessage);
