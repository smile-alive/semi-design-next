import { type JSX, type ResolvedChildren, Show, children, createUniqueId, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
import { normalizeFieldError } from '@fibrae/semi-foundation/components/form/errors';
import type { FieldErrorInput } from '@fibrae/semi-foundation/components/form/interface';
import { getFieldIds } from '@fibrae/semi-foundation/components/form/utils';
import { joinIds, namedRole } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/form/form.scss';
import type { ElementProps } from '../../base/index';
import { hasContent } from '../../utils/index';
import { useFormContext } from './context';
import ErrorMessage, { type ErrorMessageProps } from './error-message';
import FieldGrid from './field-grid';
import Label, { type LabelProps } from './label';
import { isLabelConfig } from './utils';

const prefix = cssClasses.PREFIX;

export interface SlotProps extends ElementProps<'div'> {
    label?: LabelProps | JSX.Element;
    noLabel?: boolean;
    labelPosition?: 'top' | 'left';
    /** The props of the ErrorMessage, or its `error`: a message or messages */
    error?: ErrorMessageProps | FieldErrorInput;
}

export default function Slot(props: SlotProps) {
    const [local, rest] = splitProps(props, ['children', 'class', 'error', 'label', 'labelPosition', 'noLabel']);

    const form = useFormContext();

    const generatedId = createUniqueId();

    // each read of a JSX prop creates its nodes again, so it is read once
    const label = children(() => local.label as JSX.Element);

    const formProps = () => form?.formProps;

    const labelPosition = () => local.labelPosition || formProps()?.labelPosition || 'top';

    const labelConfig = (): LabelProps => {
        const value = label();
        return isLabelConfig(value) ? value : { text: value };
    };

    // a rendered label names the slot, so the slot becomes a group its content belongs to
    const labelId = () => {
        const config = labelConfig();
        return !local.noLabel && hasContent((config.text ?? config.children) as ResolvedChildren) ? config.id || getFieldIds(generatedId).label : undefined;
    };

    const ariaLabelledby = () => joinIds(rest['aria-labelledby'], labelId());

    const errorProps = () => {
        const value = local.error;
        return isLabelConfig(value) ? (value as ErrorMessageProps) : { error: normalizeFieldError(value) };
    };

    return (
        <div {...rest} role={namedRole({ ...rest, 'aria-labelledby': ariaLabelledby() })} class={clsx(`${prefix}-field`, `${prefix}-slot`, local.class)} aria-labelledby={ariaLabelledby()} x-label-pos={labelPosition()}>
            <FieldGrid
                label={
                    <Show when={!local.noLabel}>
                        <Label align={formProps()?.labelAlign} width={formProps()?.labelWidth} {...labelConfig()} id={labelId() ?? labelConfig().id} />
                    </Show>
                }
                labelAlign={formProps()?.labelAlign}
                labelCol={formProps()?.labelCol}
                labelPosition={labelPosition()}
                mainClass={`${prefix}-field-main ${prefix}-slot-main`}
                wrapperCol={formProps()?.wrapperCol}
            >
                {local.children}
                <Show when={local.error !== undefined}>
                    <ErrorMessage {...errorProps()} />
                </Show>
            </FieldGrid>
        </div>
    );
}
