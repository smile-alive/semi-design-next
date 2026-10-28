import React, { useId } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/form/constants';
import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
import type { ElementProps } from '../_base/base';
import { namedRole } from '../_base/named-role';
import { hasContent } from '../_utils/index';
import { Col } from '../grid';
import { useFieldBridgeContext } from './context';
import ErrorMessage, { type ErrorMessageProps } from './error-message';
import Label, { type LabelProps } from './label';

const prefix = cssClasses.PREFIX;

export interface SlotProps extends ElementProps<'div'> {
    className?: string;
    style?: React.CSSProperties;
    label?: LabelProps | React.ReactNode;
    noLabel?: boolean;
    labelPosition?: 'top' | 'left';
    error?: ErrorMessageProps | React.ReactNode;
    children?: React.ReactNode;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

function isConfig(value: unknown): value is object {
    return value !== null && (typeof value === 'object' || typeof value === 'function') && !React.isValidElement(value) && !Array.isArray(value);
}

export default function FormSlot({ children, label, className, style, error, noLabel, labelPosition: slotLabelPosition, ref, ...rest }: SlotProps) {
    const fieldBridge = useFieldBridgeContext();

    const generatedId = useId();
    let slotError = null;

    const formProps = fieldBridge ? fieldBridge.getFormProps(['labelPosition', 'labelWidth', 'labelAlign', 'labelCol', 'wrapperCol']) : {};
    const { labelCol, wrapperCol, labelWidth, labelAlign } = formProps;
    const labelPosition = slotLabelPosition || formProps.labelPosition || 'top';
    const appendCol = labelCol && wrapperCol;

    const slotCls = clsx(
        {
            [`${prefix}-field`]: true,
            [`${prefix}-slot`]: true,
        },
        className
    );

    const labelColCls = labelAlign ? `${prefix}-col-${labelAlign}` : '';

    if (typeof error !== 'undefined') {
        const emProps: object = isConfig(error) ? error : { error };
        slotError = <ErrorMessage {...emProps} />;
    }

    let content: React.ReactNode;

    const labelConfig = (isConfig(label) ? label : { text: label }) as LabelProps;

    // a rendered label names the slot, so the slot becomes a group its content belongs to
    const labelId = !noLabel && hasContent(labelConfig.text ?? labelConfig.children) ? labelConfig.id || `${generatedId}-label` : undefined;

    const mergeLabelProps = {
        align: labelAlign,
        width: labelWidth,
        ...labelConfig,
        id: labelId ?? labelConfig.id,
    };

    const ariaLabelledby = joinIds(rest['aria-labelledby'], labelId);
    const mainCls = `${prefix}-field-main ${prefix}-slot-main`;

    if (!appendCol) {
        content = (
            <>
                {!noLabel && <Label {...mergeLabelProps} />}
                <div className={mainCls}>
                    {children}
                    {slotError}
                </div>
            </>
        );
    } else {
        const labelColContent = (
            <Col {...labelCol} className={labelColCls}>
                {!noLabel && <Label {...mergeLabelProps} />}
            </Col>
        );
        content = (
            <>
                {/* without overflow hidden a top label lays out horizontally */}
                {labelPosition === 'top' ? <div style={{ overflow: 'hidden' }}>{labelColContent}</div> : labelColContent}
                <Col {...wrapperCol}>
                    <div className={mainCls}>
                        {children}
                        {slotError}
                    </div>
                </Col>
            </>
        );
    }

    return (
        <div role={namedRole({ ...rest, 'aria-labelledby': ariaLabelledby })} {...rest} ref={ref} className={slotCls} style={style} aria-labelledby={ariaLabelledby} x-label-pos={labelPosition}>
            {content}
        </div>
    );
}
