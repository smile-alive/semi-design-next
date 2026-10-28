import React, { useEffectEvent, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/form/constants';
import FormFoundation, { type BaseFormAdapter } from '@fibrae/semi-foundation/form/foundation';
import type { FieldBridge } from '@fibrae/semi-foundation/form/interface';
import { noop } from '@fibrae/semi-foundation/utils/function';
import warning from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/form/form.scss';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import { cloneDeep } from '../_utils/index';
import Row from '../grid/row';
import { FormStateContext, FormApiContext, FieldBridgeContext } from './context';
import ErrorMessage from './error-message';
import { FormInput, FormInputNumber, FormTextArea, FormSelect, FormCheckboxGroup, FormCheckbox, FormRadioGroup, FormRadio, FormDatePicker, FormSwitch, FormSlider, FormTimePicker, FormTreeSelect, FormCascader, FormRating, FormAutoComplete, FormUpload, FormTagInput, FormPinCode } from './field';
import FormInputGroup from './group';
import useForm from './hooks/use-form';
import type { BaseFormProps, FormState, FormApi } from './interface';
import Label from './label';
import Section from './section';
import Slot from './slot';
const prefix = cssClasses.PREFIX;

interface BaseFormState {
    formState?: FormState;
}

const defaultProps = {
    onChange: noop,
    onSubmitFail: noop,
    onSubmit: noop,
    onReset: noop,
    onValueChange: noop,
    onErrorChange: noop,
    layout: 'vertical',
    labelPosition: 'top',
    allowEmpty: false,
    autoScrollToError: false,
    showValidateIcon: true,
} satisfies Partial<BaseFormProps>;

function pickFormProps(props: Record<string, any>, keys?: Array<string>) {
    if (typeof keys === 'undefined') {
        return props;
    }
    return Object.fromEntries(keys.map((key) => [key, props[key]]));
}

function Form<Values extends Record<string, any> = any>(rawProps: BaseFormProps<Values>) {
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

    const generatedId = useId();
    const formRef = useRef<HTMLFormElement>(null);
    let content = children as React.ReactNode;

    const [foundation, state] = useFoundation<FormFoundation<React.SubmitEvent<HTMLFormElement>>, BaseFormAdapter<BaseFormProps<Values>, BaseFormState, Values, React.SubmitEvent<HTMLFormElement>>, BaseFormProps<Values>, BaseFormState>(
        FormFoundation,
        props,
        () => ({}),
        (base) => ({
            cloneDeep,
            notifySubmit: (values, e) => base.getProps().onSubmit(values, e),
            notifySubmitFail: (errors, values, e) => base.getProps().onSubmitFail(errors, values, e),
            forceUpdate: (formState, callback) => {
                base.setState({ formState }, callback);
                const { form } = base.getProps();
                if (form && typeof form.__updateState === 'function') {
                    form.__updateState(formState);
                }
            },
            notifyChange: (formState) => base.getProps().onChange(formState),
            notifyValueChange: (values, changedValues) => base.getProps().onValueChange(values, changedValues),
            notifyErrorChange: (errors, changedError) => base.getProps().onErrorChange(errors, changedError),
            notifyReset: () => base.getProps().onReset(),
            getInitValues: () => base.getProp('initValues'),
            getFormProps: (keys) => pickFormProps(base.getProps(), keys),
            getFormElement: () => formRef.current,
        })
    );

    const [initialFormState] = useState(() => foundation.getFormState());
    const [formApi] = useState(() => foundation.getFormApi() as FormApi<Values>);
    const [foundationBridge] = useState(() => foundation.getFieldBridge());

    const formState = state.formState ?? initialFormState;

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
        if (props.getFormApi) {
            props.getFormApi(formApi);
        }
        if (props.form && typeof props.form.__bind === 'function') {
            props.form.__bind(formApi);
        }
    });

    const unmount = useEffectEvent(() => {
        if (props.form && typeof props.form.__unbind === 'function') {
            props.form.__unbind();
        }
    });

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (props.stopPropagation && props.stopPropagation.submit) {
            e.stopPropagation();
        }
        foundation.submit(e);
    };

    const handleReset = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (props.stopPropagation && props.stopPropagation.reset) {
            e.stopPropagation();
        }
        foundation.reset();
    };

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

    const xId = id ? id : generatedId;

    const formContent = (
        <form style={style} noValidate {...rest} ref={formRef} id={xId} className={formCls} x-form-id={xId} onReset={handleReset} onSubmit={handleSubmit}>
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

export default Object.assign(Form, {
    Input: FormInput,
    TextArea: FormTextArea,
    InputNumber: FormInputNumber,
    Select: FormSelect,
    Checkbox: FormCheckbox,
    CheckboxGroup: FormCheckboxGroup,
    Radio: FormRadio,
    RadioGroup: FormRadioGroup,
    DatePicker: FormDatePicker,
    TimePicker: FormTimePicker,
    Switch: FormSwitch,
    Slider: FormSlider,
    TreeSelect: FormTreeSelect,
    Cascader: FormCascader,
    Rating: FormRating,
    AutoComplete: FormAutoComplete,
    Upload: FormUpload,
    TagInput: FormTagInput,
    PinCode: FormPinCode,
    Slot,
    ErrorMessage,
    InputGroup: FormInputGroup,
    Label,
    Section,
    useForm,
});
