import { type JSX, type ResolvedChildren, Show, children, createUniqueId, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/form/constants';
import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
import '@fibrae/semi-foundation/form/form.scss';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import { namedRole } from '../_base/named-role';
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
    error?: ErrorMessageProps | JSX.Element;
}

export default function Slot(props: SlotProps) {
    const [local, rest] = splitProps(props, ['children', 'class', 'error', 'label', 'labelPosition', 'noLabel']);

    const form = useFormContext();

    const generatedId = createUniqueId();

    // each read of a JSX prop creates its nodes again, so both are read once
    const label = children(() => local.label as JSX.Element);
    const error = children(() => local.error as JSX.Element);

    const formProps = () => form?.formProps;

    const labelPosition = () => local.labelPosition || formProps()?.labelPosition || 'top';

    const labelConfig = (): LabelProps => {
        const value = label();
        return isLabelConfig(value) ? value : { text: value };
    };

    // a rendered label names the slot, so the slot becomes a group its content belongs to
    const labelId = () => {
        const config = labelConfig();
        return !local.noLabel && hasContent((config.text ?? config.children) as ResolvedChildren) ? config.id || `${generatedId}-label` : undefined;
    };

    const ariaLabelledby = () => joinIds(rest['aria-labelledby'], labelId());

    const errorProps = () => {
        const value = error();
        return isLabelConfig(value) ? (value as ErrorMessageProps) : { error: value };
    };

    return (
        <div {...rest} role={namedRole(rest.role, rest['aria-label'], ariaLabelledby()) as JSX.HTMLAttributes<HTMLDivElement>['role']} class={clsx(`${prefix}-field`, `${prefix}-slot`, local.class)} aria-labelledby={ariaLabelledby()} x-label-pos={labelPosition()}>
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
                <Show when={error() !== undefined}>
                    <ErrorMessage {...errorProps()} />
                </Show>
            </FieldGrid>
        </div>
    );
}
