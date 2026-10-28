import { Index, type JSX, Match, Show, Switch, children, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/form/constants';
import '@fibrae/semi-foundation/form/form.scss';
import { IconAlertCircle, IconAlertTriangle } from '@fibrae/semi-icons-solid';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import type { FieldError } from './interface';
import { hasErrorContent } from './utils';

const prefix = cssClasses.PREFIX;

export interface ErrorMessageProps extends ElementProps<'div'> {
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

    // each read of a JSX prop creates its nodes again, so both are read once
    const error = children(() => local.error);

    // An error replaces the help text, and so does async-validator's `message: ''` ("failed, hide the text": helpText
    // would look like success). The help text is not created then: nodes that are not inserted cannot be hydrated.
    const helpText = children(() => (error() || (error() === '' && local.validateStatus === 'error') ? undefined : local.helpText));

    const textShown = () => (error() ? hasErrorContent(error()) : hasContent(helpText()));

    // only an array error without content (e.g. InputGroup collecting [false, false]) renders nothing
    const rendered = () => (error() ? !Array.isArray(error()) || hasErrorContent(error()) : hasContent(helpText()));

    const errorItems = () => {
        const value = error();
        return Array.isArray(value) ? value.filter(Boolean) : [value];
    };

    return (
        <Show when={rendered()}>
            <div
                {...rest}
                class={clsx(
                    {
                        [`${prefix}-field-error-message`]: Boolean(error()),
                        [`${prefix}-field-help-text`]: hasContent(helpText()),
                    },
                    local.class
                )}
            >
                <Show when={textShown()}>
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
                    <Show when={error()} fallback={<span id={local.helpTextId}>{helpText()}</span>}>
                        <span id={local.errorMessageId}>
                            <Index each={errorItems()}>
                                {(item, i) => (
                                    <>
                                        {i > 0 && ', '}
                                        {item() as JSX.Element}
                                    </>
                                )}
                            </Index>
                        </span>
                    </Show>
                </Show>
            </div>
        </Show>
    );
}
