import React, { useEffectEvent, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
import { getFormApiProxyInternals } from '@fibrae/semi-foundation/components/form/form-api-proxy';
import FormFoundation, { type BaseFormAdapter } from '@fibrae/semi-foundation/components/form/foundation';
import type { AllErrors, FieldBridge, FormFoundationState } from '@fibrae/semi-foundation/components/form/interface';
import { pickFormProps } from '@fibrae/semi-foundation/components/form/utils';
import warning from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/components/form/form.scss';
import useDefaultProps from '../../base/use-default-props';
import useFoundation from '../../base/use-foundation';
import { cloneDeep } from '../../utils/index';
import Row from '../grid/row';
import useLocale from '../locale/use-locale';
import { FormStateContext, FormApiContext, FieldBridgeContext } from './context';
import type { BaseFormProps, FormApi } from './interface';
const prefix = cssClasses.PREFIX;

const defaultProps = {
    layout: 'vertical',
    labelPosition: 'top',
    allowEmpty: false,
    autoScrollToError: false,
    showValidateIcon: true,
    keepState: true,
    schemaDebounce: 0,
} satisfies Partial<BaseFormProps>;

export default function Form<Values extends Record<string, any> = any, Output = Values>(rawProps: BaseFormProps<Values, Output>) {
    const props = useDefaultProps('Form', rawProps, defaultProps);

    const {
        children,
        form,
        getFormApi,
        onChange,
        onSubmit,
        onSubmitFail,
        onErrorChange,
        onValueChange,
        onReset,
        component,
        render,
        validator,
        schema,
        schemaDebounce,
        keepState,
        initValues,
        layout,
        style,
        className,
        labelPosition,
        labelWidth,
        labelAlign,
        labelCol,
        wrapperCol,
        allowEmpty,
        autoScrollToError,
        showValidateIcon,
        stopValidateWithError,
        stopPropagation,
        extraTextPosition,
        disabled,
        id,
        trigger,
        ref,
        ...rest
    } = props;

    const { locale } = useLocale('Form');

    const generatedId = useId();
    const formRef = useRef<HTMLFormElement>(null);
    let content = children as React.ReactNode;

    const [foundation, state] = useFoundation<FormFoundation<React.SubmitEvent<HTMLFormElement>>, BaseFormAdapter<BaseFormProps<Values, Output>, Values, React.SubmitEvent<HTMLFormElement>>, BaseFormProps<Values, Output>, FormFoundationState, { locale: typeof locale }>(
        FormFoundation,
        props,
        () => FormFoundation.getInitialState(props),
        (base) => ({
            cloneDeep,
            notifySubmit: (values, e) => base.getProps().onSubmit?.(values, e),
            // the type names the field errors; a thrown or non-object result of the Form validator passes through as it is
            notifySubmitFail: (errors, values, e) => base.getProps().onSubmitFail?.(errors as Partial<AllErrors<Values>>, values, e),
            getLocale: () => base.getContext('locale'),
            notifyChange: (formState) => base.getProps().onChange?.(formState),
            notifyValueChange: (values, changedValues) => base.getProps().onValueChange?.(values, changedValues),
            notifyErrorChange: (errors, changedError) => base.getProps().onErrorChange?.(errors, changedError),
            notifyReset: () => base.getProps().onReset?.(),
            getFormElement: () => formRef.current,
        }),
        { locale }
    );

    const [formApi] = useState(() => foundation.getFormApi() as FormApi<Values, Output>);
    const [foundationBridge] = useState(foundation.getFieldBridge);

    const { formState } = state;

    // fields read this render's props; the foundation only sees them after commit
    const fieldBridge: FieldBridge = {
        ...foundationBridge,
        getFormProps: (keys?: Array<string>) => pickFormProps(props, keys),
    };

    const contentProps = { formState, formApi, values: formState.values };

    const mount = useEffectEvent(() => {
        warning(Boolean(props.component && props.render), '[Semi Form] You should not use <Form component> and <Form render> in ths same time; <Form render> will be ignored');
        warning(Boolean(props.component) && React.Children.count(props.children) > 0, '[Semi Form] You should not use <Form component> and <Form>{children}</Form> in ths same time; <Form>{children}</Form> will be ignored');
        warning(Boolean(props.render) && React.Children.count(props.children) > 0, '[Semi Form] You should not use <Form render> and <Form>{children}</Form> in ths same time; <Form>{children}</Form> will be ignored');
        props.getFormApi?.(formApi);
        getFormApiProxyInternals(props.form)?.bind(formApi);
    });

    const unmount = useEffectEvent(() => {
        getFormApiProxyInternals(props.form)?.unbind();
    });

    useLayoutEffect(() => {
        mount();
        return () => unmount();
    }, []);

    useImperativeHandle(props.ref, () => ({ formApi }), [formApi]);

    if (component) {
        content = React.createElement(component, contentProps);
    } else if (render) {
        content = render(contentProps);
    } else if (typeof children === 'function') {
        content = children(contentProps);
    }

    const formCls = clsx(prefix, className, {
        [prefix + '-vertical']: layout === 'vertical',
        [prefix + '-horizontal']: layout === 'horizontal',
    });

    const xId = id || generatedId;

    const formContent = (
        <form style={style} noValidate {...rest} ref={formRef} id={xId} className={formCls} x-form-id={xId} onReset={foundation.handleResetEvent} onSubmit={foundation.handleSubmitEvent}>
            {content}
        </form>
    );

    return (
        <FieldBridgeContext value={fieldBridge}>
            <FormApiContext value={formApi}>
                <FormStateContext value={formState}>{wrapperCol && labelCol ? <Row>{formContent}</Row> : formContent}</FormStateContext>
            </FormApiContext>
        </FieldBridgeContext>
    );
}
