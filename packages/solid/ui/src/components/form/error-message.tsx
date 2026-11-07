import { type JSX, Match, Show, Switch, children, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
import { errorMessages, isErrorLeaf } from '@fibrae/semi-foundation/components/form/errors';
import '@fibrae/semi-foundation/components/form/form.scss';
import { IconAlertCircle, IconAlertTriangle } from '@fibrae/semi-icons-solid';
import type { ElementProps } from '../../base/element-props';
import hasContent from '../../utils/has-content';
import type { FieldError } from './interface';

const prefix = cssClasses.PREFIX;

export interface ErrorMessageProps extends ElementProps<'div'> {
    /** The messages, joined with `, `; `['']` is an error without a text, which hides the help text as well */
    error?: FieldError;
    showValidateIcon?: boolean;
    validateStatus?: string;
    helpText?: JSX.Element;
    isInInputGroup?: boolean;
    /** The id of the error text, the target of the control's aria-errormessage */
    errorMessageId?: string;
    /** The id of the help text, the target of the control's aria-describedby */
    helpTextId?: string;
}

export default function ErrorMessage(props: ErrorMessageProps) {
    const [local, rest] = splitProps(props, ['class', 'error', 'errorMessageId', 'helpText', 'helpTextId', 'isInInputGroup', 'showValidateIcon', 'validateStatus']);

    // An error replaces the help text, and so does `['']` ("failed, hide the text": helpText would look like success).
    // The help text is not created then: nodes that are not inserted cannot be hydrated.
    const helpText = children(() => (isErrorLeaf(local.error) ? undefined : local.helpText));

    const failed = () => isErrorLeaf(local.error);

    const errorText = () => errorMessages(local.error).join(', ');

    const shown = () => (failed() ? errorText() !== '' : hasContent(helpText()));

    return (
        <Show when={shown()}>
            <div
                {...rest}
                class={clsx(
                    {
                        [`${prefix}-field-error-message`]: failed(),
                        [`${prefix}-field-help-text`]: hasContent(helpText()),
                    },
                    local.class
                )}
            >
                <Show when={local.showValidateIcon}>
                    <Switch>
                        <Match when={local.isInInputGroup || local.validateStatus === 'error'}>
                            <IconAlertCircle class={`${prefix}-field-validate-status-icon`} />
                        </Match>
                        <Match when={local.validateStatus === 'warning'}>
                            <IconAlertTriangle class={`${prefix}-field-validate-status-icon`} />
                        </Match>
                    </Switch>
                </Show>
                {/* the span id is the target of aria-errormessage and aria-describedby */}
                <Show when={failed()} fallback={<span id={local.helpTextId}>{helpText()}</span>}>
                    <span id={local.errorMessageId}>{errorText()}</span>
                </Show>
            </div>
        </Show>
    );
}
