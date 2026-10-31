import React, { isValidElement, useEffect, useId } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/form/constants';
import { isValid } from '@fibrae/semi-foundation/form/utils';
import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
import warning from '@fibrae/semi-foundation/utils/warning';
import flattenChildren from '../_base/flatten-children';
import { Col } from '../grid/index';
import InputGroup, { type InputGroupProps as BacisInputGroupProps } from '../input/input-group';
import { useFieldBridgeContext } from './context';
import ErrorMessage, { type ReactFieldError } from './error-message';
import { useFormState } from './hooks/index';
import type { FormState } from './interface';
import Label, { type LabelProps } from './label';
interface GroupErrorProps {
    showValidateIcon?: boolean;
    isInInputGroup?: boolean;
    error?: ReactFieldError;
    fieldSet?: string[];
    errorMessageId?: string;
}
export interface InputGroupProps extends Omit<BacisInputGroupProps, 'label'> {
    label?: LabelProps | React.ReactNode;
    labelPosition?: 'left' | 'top';
    extraText?: React.ReactNode;
    extraTextPosition?: 'bottom' | 'middle';
}

const prefix = cssClasses.PREFIX;

function GroupError(props: GroupErrorProps) {
    const { fieldSet } = props;

    const formState: FormState = useFormState();

    const error = fieldSet.map((field: string) => ObjectUtil.get(formState.errors, field));

    if (isValid(error)) {
        return null;
    }

    return <ErrorMessage error={error} errorMessageId={props.errorMessageId} isInInputGroup={props.isInInputGroup} showValidateIcon={props.showValidateIcon} />;
}

export default function FormInputGroup(props: InputGroupProps) {
    const { children, label, extraText, extraTextPosition = 'bottom', 'aria-labelledby': ariaLabelledby, 'aria-describedby': ariaDescribedby, 'aria-errormessage': _ariaErrormessage, ...rest } = props as InputGroupProps & Record<`aria-${string}`, string | undefined>;

    const fieldBridge = useFieldBridgeContext();

    const generatedId = useId();

    useEffect(() => {
        warning(!fieldBridge, '[Semi Form]: Form.InputGroup must be used inside the Form, please check your dom declaration');
    }, [fieldBridge]);

    if (!fieldBridge) {
        return null;
    }

    let labelContent = null;
    let labelId: string | undefined;

    const formProps = fieldBridge.getFormProps(['labelPosition', 'labelWidth', 'labelAlign', 'showValidateIcon', 'wrapperCol', 'labelCol', 'disabled']);
    const labelPosition = props.labelPosition || formProps.labelPosition;
    const generatedLabelId = `${generatedId}-label`;
    const groupErrorId = `${generatedId}-errormessage`;
    const extraTextId = `${generatedId}-extraText`;

    if (label) {
        const labelProps: LabelProps = typeof label === 'object' && !isValidElement(label) && !Array.isArray(label) ? (label as LabelProps) : { text: label };
        labelId = labelProps.id || generatedLabelId;
        labelContent = <Label width={formProps.labelWidth} {...labelProps} id={labelId} />;
    }

    let content: React.ReactNode;

    const groupFieldSet: Array<string> = [];

    const inner = flattenChildren(children).map((child: any) => {
        if (child && child.props && child.props.field) {
            groupFieldSet.push(child.props.field);
            // merged per child: InputGroup would overwrite each field's own references with the group's
            return React.cloneElement(child, {
                isInInputGroup: true,
                'aria-labelledby': joinIds(child.props['aria-labelledby'], ariaLabelledby, labelId),
                'aria-describedby': joinIds(child.props['aria-describedby'], ariaDescribedby, extraText && extraTextId),
                'aria-errormessage': groupErrorId,
            });
        }
        return null;
    });

    const { labelCol, wrapperCol, labelAlign } = formProps;
    const appendCol = labelCol && wrapperCol;
    const labelColCls = labelAlign ? `${prefix}-col-${labelAlign}` : '';

    const extraCls = clsx(`${prefix}-field-extra`, {
        [`${prefix}-field-extra-string`]: typeof extraText === 'string',
        [`${prefix}-field-extra-middle`]: extraTextPosition === 'middle',
        [`${prefix}-field-extra-bottom`]: extraTextPosition === 'bottom',
    });

    const extraContent = extraText ? (
        <div id={extraTextId} className={extraCls} x-semi-prop="extraText">
            {extraText}
        </div>
    ) : null;

    const mainContent = (
        <>
            {extraTextPosition === 'middle' && extraContent}
            <InputGroup {...rest} disabled={rest.disabled ?? formProps.disabled}>
                {inner}
            </InputGroup>
            {extraTextPosition === 'bottom' && extraContent}
            <GroupError errorMessageId={groupErrorId} fieldSet={groupFieldSet} isInInputGroup showValidateIcon={formProps.showValidateIcon} />
        </>
    );

    if (!appendCol) {
        content = (
            <>
                {labelContent}
                <div>{mainContent}</div>
            </>
        );
    } else {
        const labelColContent = (
            <Col {...labelCol} className={labelColCls}>
                {labelContent}
            </Col>
        );
        content = (
            <>
                {/* without overflow hidden a top label lays out horizontally */}
                {labelPosition === 'top' ? <div style={{ overflow: 'hidden' }}>{labelColContent}</div> : labelColContent}
                <Col {...wrapperCol}>{mainContent}</Col>
            </>
        );
    }

    return (
        <div className={`${prefix}-field-group`} aria-labelledby={labelId} role={labelId ? 'group' : undefined} x-label-pos={labelPosition}>
            {content}
        </div>
    );
}
