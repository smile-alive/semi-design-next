import React, { isValidElement, useEffect, useId } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
import { isErrorLeaf } from '@fibrae/semi-foundation/components/form/errors';
import { getFieldIds } from '@fibrae/semi-foundation/components/form/utils';
import { joinIds, warning } from '@fibrae/semi-foundation/utils';
import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
import { flattenChildren } from '../../utils/index';
import { Col } from '../grid/index';
import InputGroup, { type InputGroupProps as BacisInputGroupProps } from '../input/input-group';
import { useFieldBridgeContext } from './context';
import ErrorMessage, { type ErrorMessageInternalProps } from './error-message';
import { useFormState } from './hooks';
import type { FormState } from './interface';
import Label, { type LabelProps } from './label';
interface GroupErrorProps {
    showValidateIcon?: boolean;
    isInInputGroup?: boolean;
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

const InternalErrorMessage = ErrorMessage as (props: ErrorMessageInternalProps) => React.ReactNode;

function GroupError(props: GroupErrorProps) {
    const { fieldSet } = props;

    const formState: FormState = useFormState();

    const error = fieldSet.flatMap((field) => {
        const fieldError = ObjectUtil.get(formState.errors, field);
        return isErrorLeaf(fieldError) ? fieldError : [];
    });

    if (!error.length) {
        return null;
    }

    return <InternalErrorMessage error={error} errorMessageId={props.errorMessageId} isInInputGroup={props.isInInputGroup} showValidateIcon={props.showValidateIcon} />;
}

export default function FormInputGroup(props: InputGroupProps) {
    const { children, label, extraText, extraTextPosition = 'bottom', 'aria-labelledby': ariaLabelledby, 'aria-describedby': ariaDescribedby, 'aria-errormessage': _ariaErrormessage, ...rest } = props as InputGroupProps & Record<`aria-${string}`, string | undefined>;

    const fieldBridge = useFieldBridgeContext();

    const generatedId = useId();

    useEffect(() => {
        warning(!fieldBridge, '[Semi Form]: FormInputGroup must be used inside the Form, please check your dom declaration');
    }, [fieldBridge]);

    if (!fieldBridge) {
        return null;
    }

    let labelContent = null;
    let labelId: string | undefined;

    const formProps = fieldBridge.getFormProps(['labelPosition', 'labelWidth', 'labelAlign', 'showValidateIcon', 'wrapperCol', 'labelCol', 'disabled']);
    const labelPosition = props.labelPosition || formProps.labelPosition;
    const ids = getFieldIds(generatedId);

    if (label) {
        const labelProps: LabelProps = typeof label === 'object' && !isValidElement(label) && !Array.isArray(label) ? (label as LabelProps) : { text: label };
        labelId = labelProps.id || ids.label;
        labelContent = <Label width={formProps.labelWidth} {...labelProps} id={labelId} />;
    }

    let content: React.ReactNode;

    const groupFieldSet: Array<string> = [];

    const inner = flattenChildren(children).map((child: any) => {
        if (child?.props?.field) {
            groupFieldSet.push(child.props.field);
            // merged per child: InputGroup would overwrite each field's own references with the group's
            return React.cloneElement(child, {
                isInInputGroup: true,
                'aria-labelledby': joinIds(child.props['aria-labelledby'], ariaLabelledby, labelId),
                'aria-describedby': joinIds(child.props['aria-describedby'], ariaDescribedby, extraText && ids.extraText),
                'aria-errormessage': ids.errorMessage,
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
        <div id={ids.extraText} className={extraCls} x-semi-prop="extraText">
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
            <GroupError errorMessageId={ids.errorMessage} fieldSet={groupFieldSet} isInInputGroup showValidateIcon={formProps.showValidateIcon} />
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
                {/* a top label takes a line of its own, or a Row would lay it out beside the wrapper column */}
                {labelPosition === 'top' ? <div style={{ flexBasis: '100%' }}>{labelColContent}</div> : labelColContent}
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
