import { type JSX, Show, children, createMemo, createSignal, createUniqueId, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/form/constants';
import { isValid } from '@fibrae/semi-foundation/form/utils';
import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
import warning from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/form/form.scss';
import hasContent from '../_base/has-content';
import InputGroup, { type InputGroupProps as BaseInputGroupProps } from '../input/input-group';
import { type FormInputGroupContextValue, FormInputGroupContext, useFormContext } from './context';
import ErrorMessage from './error-message';
import FieldGrid from './field-grid';
import Label, { type LabelProps } from './label';
import { isLabelConfig } from './utils';

const prefix = cssClasses.PREFIX;

export interface InputGroupProps extends Omit<BaseInputGroupProps, 'label' | 'labelPosition'> {
    label?: LabelProps | JSX.Element;
    labelPosition?: 'left' | 'top';
    extraText?: JSX.Element;
    extraTextPosition?: 'bottom' | 'middle';
}

/** An InputGroup laid out as a field: the fields inside render bare, and their errors show together below */
export default function FormInputGroup(props: InputGroupProps) {
    const [local, rest] = splitProps(props, ['aria-describedby', 'aria-errormessage', 'aria-labelledby', 'children', 'extraText', 'extraTextPosition', 'label', 'labelPosition']);

    const form = useFormContext();

    const generatedId = createUniqueId();
    const [fields, setFields] = createSignal<string[]>([]);

    // each read of a JSX prop creates its nodes again, so both are read once
    const label = children(() => local.label as JSX.Element);
    const extraText = children(() => local.extraText);
    const errorMessageId = `${generatedId}-errormessage`;
    const extraTextId = `${generatedId}-extraText`;
    const groupError = createMemo(() => fields().map((field) => ObjectUtil.get(form?.formState().errors ?? {}, field)));

    const formProps = () => form?.formProps;

    const labelPosition = () => local.labelPosition || formProps()?.labelPosition;

    const extraTextPosition = () => local.extraTextPosition ?? 'bottom';

    const hasExtraText = () => hasContent(extraText());

    const labelConfig = (): LabelProps | undefined => {
        const value = label();
        if (isLabelConfig(value)) {
            return value;
        }
        return hasContent(value) ? { text: value } : undefined;
    };

    const labelId = () => {
        const config = labelConfig();
        return config ? config.id || `${generatedId}-label` : undefined;
    };

    const context: FormInputGroupContextValue = {
        registerField: (field) => {
            setFields((current) => [...current, field]);
            return () => setFields((current) => current.toSpliced(current.indexOf(field), 1));
        },
        // the group's own aria attributes stay on its role="group" element, so each field adds these to its own references
        aria: () => ({
            labelledby: joinIds(local['aria-labelledby'], labelId()),
            describedby: joinIds(local['aria-describedby'], hasExtraText() && extraTextId),
            errormessage: errorMessageId,
        }),
    };

    warning(!form, '[Semi Form]: Form.InputGroup must be used inside the Form, please check your dom declaration');

    const extraContent = () => (
        <Show when={hasExtraText()}>
            <div
                id={extraTextId}
                class={clsx(`${prefix}-field-extra`, {
                    [`${prefix}-field-extra-string`]: typeof extraText() === 'string',
                    [`${prefix}-field-extra-middle`]: extraTextPosition() === 'middle',
                    [`${prefix}-field-extra-bottom`]: extraTextPosition() === 'bottom',
                })}
                x-semi-prop="extraText"
            >
                {extraText()}
            </div>
        </Show>
    );

    return (
        <Show when={form}>
            <div class={`${prefix}-field-group`} aria-labelledby={labelId()} role={labelId() ? 'group' : undefined} x-label-pos={labelPosition()}>
                <FieldGrid
                    label={
                        <Show when={labelConfig()} keyed>
                            {(config) => <Label width={formProps()?.labelWidth} {...config} id={labelId()} />}
                        </Show>
                    }
                    labelAlign={formProps()?.labelAlign}
                    labelCol={formProps()?.labelCol}
                    labelPosition={labelPosition()}
                    wrapperCol={formProps()?.wrapperCol}
                >
                    <Show when={extraTextPosition() === 'middle'}>{extraContent()}</Show>
                    <InputGroup {...rest} disabled={rest.disabled ?? formProps()?.disabled}>
                        <FormInputGroupContext.Provider value={context}>{local.children}</FormInputGroupContext.Provider>
                    </InputGroup>
                    <Show when={extraTextPosition() === 'bottom'}>{extraContent()}</Show>
                    <Show when={!isValid(groupError())}>
                        <ErrorMessage error={groupError()} errorMessageId={errorMessageId} isInInputGroup showValidateIcon={formProps()?.showValidateIcon} />
                    </Show>
                </FieldGrid>
            </div>
        </Show>
    );
}
