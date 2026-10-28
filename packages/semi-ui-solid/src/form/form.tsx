import { type JSX, Match, Show, Switch, createUniqueId, onCleanup, onMount, splitProps, untrack } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/form/constants';
import FormFoundation from '@fibrae/semi-foundation/form/foundation';
import type { BaseFormAdapter } from '@fibrae/semi-foundation/form/interface';
import warning from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/form/form.scss';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import { Row } from '../grid';
import { type FormContextValue, FormContext } from './context';
import ErrorMessage from './error-message';
import FormInputGroup from './input-group';
import type { FormApi, FormElement, FormProps, FormRenderProps, FormState } from './interface';
import Label from './label';
import Section from './section';
import Slot from './slot';
import useForm from './use-form';
import { batchMethods, cloneDeep } from './utils';

const prefix = cssClasses.PREFIX;

interface FormFoundationState {
    formState?: FormState;
}

const defaultProps = {
    layout: 'vertical',
    labelPosition: 'top',
    allowEmpty: false,
    autoScrollToError: false,
    showValidateIcon: true,
} satisfies Partial<FormProps>;

function pickFormProps(props: Record<string, any>, keys?: string[]) {
    return keys ? Object.fromEntries(keys.map((key) => [key, props[key]])) : props;
}

function Form<Values extends Record<string, any> = any>(rawProps: FormProps<Values>) {
    type Foundation = FormFoundation<SubmitEvent>;
    type Adapter = BaseFormAdapter<FormProps<Values>, FormFoundationState, Values, SubmitEvent>;

    const props = useDefaultProps('Form', rawProps, defaultProps);

    const [local, rest] = splitProps(props, [
        'allowEmpty',
        'autoScrollToError',
        'children',
        'class',
        'component',
        'disabled',
        'extraTextPosition',
        'form',
        'getFormApi',
        'id',
        'initValues',
        'labelAlign',
        'labelCol',
        'labelPosition',
        'labelWidth',
        'layout',
        'onChange',
        'onErrorChange',
        'onReset',
        'onSubmit',
        'onSubmitFail',
        'onValueChange',
        'ref',
        'render',
        'showValidateIcon',
        'stopPropagation',
        'stopValidateWithError',
        'trigger',
        'validator',
        'wrapperCol',
    ]);

    const generatedId = createUniqueId();
    let formElement: HTMLFormElement | undefined;

    const { foundation, state } = useFoundation<Foundation, Adapter, FormProps<Values>, FormFoundationState>(
        FormFoundation,
        props,
        () => ({}),
        (base) => ({
            cloneDeep,
            notifySubmit: (values, e) => local.onSubmit?.(values, e),
            notifySubmitFail: (errors, values, e) => local.onSubmitFail?.(errors, values, e),
            forceUpdate: (formState, callback) => {
                base.setState({ formState }, callback);
                local.form?.__updateState?.(formState);
            },
            notifyChange: (formState) => local.onChange?.(formState),
            notifyValueChange: (values, changedValues) => local.onValueChange?.(values, changedValues),
            notifyErrorChange: (errors, changedError) => local.onErrorChange?.(errors, changedError),
            notifyReset: () => local.onReset?.(),
            getInitValues: () => local.initValues as Partial<Values>,
            getFormProps: (keys) => pickFormProps(props, keys),
            getFormElement: () => formElement ?? null,
        })
    );

    const initialFormState = foundation.getFormState();
    const formApi = batchMethods(foundation.getFormApi()) as FormApi<Values>;

    const formId = () => local.id ?? generatedId;

    const formState = () => state().formState ?? initialFormState;

    // read lazily, so a render function or component that reads them in its JSX follows the form state
    const renderProps: FormRenderProps<Values> = {
        get formState() {
            return formState() as FormState<Values>;
        },
        get values() {
            return formState().values as Values;
        },
        formApi,
    };

    const context: FormContextValue = { formState, formProps: props as FormProps, formApi, bridge: batchMethods(foundation.getFieldBridge()) };

    // a render function is called once, untracked, like the function child of Solid's Show
    const childContent = () => {
        const child = local.children;
        return typeof child === 'function' && child.length > 0 ? untrack(() => child(renderProps)) : (child as JSX.Element);
    };

    const handleSubmit = (e: SubmitEvent) => {
        e.preventDefault();
        if (local.stopPropagation?.submit) {
            e.stopPropagation();
        }
        foundation.submit(e);
    };

    const handleReset = (e: Event) => {
        e.preventDefault();
        if (local.stopPropagation?.reset) {
            e.stopPropagation();
        }
        foundation.reset();
    };

    const formView = () => (
        <form
            novalidate
            {...rest}
            ref={(node) => {
                formElement = Object.assign(node, { formApi });
                local.ref?.(formElement as FormElement<Values>);
            }}
            id={formId()}
            class={clsx(prefix, local.class, {
                [`${prefix}-vertical`]: local.layout === 'vertical',
                [`${prefix}-horizontal`]: local.layout === 'horizontal',
            })}
            x-form-id={formId()}
            onReset={handleReset}
            onSubmit={handleSubmit}
        >
            <Switch fallback={childContent()}>
                <Match when={local.component} keyed>
                    {(component) => <Dynamic component={component} {...renderProps} />}
                </Match>
                <Match when={local.render} keyed>
                    {(render) => render(renderProps)}
                </Match>
            </Switch>
        </form>
    );

    // Built before the onMount below: the fields inside register in their own onMount first, as the foundation
    // expects, and the cleanup registered there runs before theirs, so the destroyed Form skips one onChange per field.
    const view = (
        <FormContext.Provider value={context}>
            <Show when={local.labelCol && local.wrapperCol} fallback={formView()}>
                <Row>{formView()}</Row>
            </Show>
        </FormContext.Provider>
    );

    onMount(() => {
        warning(Boolean(local.component && local.render), '[Semi Form] You should not use <Form component> and <Form render> in ths same time; <Form render> will be ignored');
        // `in` checks for children without reading the getter, which would create them
        warning(Boolean(local.component) && 'children' in rawProps, '[Semi Form] You should not use <Form component> and <Form>{children}</Form> in ths same time; <Form>{children}</Form> will be ignored');
        warning(Boolean(local.render) && 'children' in rawProps, '[Semi Form] You should not use <Form render> and <Form>{children}</Form> in ths same time; <Form>{children}</Form> will be ignored');
        local.getFormApi?.(formApi);
        local.form?.__bind?.(formApi);
        onCleanup(() => {
            foundation.destroy();
            local.form?.__unbind?.();
        });
    });

    return view;
}

export default Object.assign(Form, {
    Section,
    Label,
    ErrorMessage,
    Slot,
    InputGroup: FormInputGroup,
    useForm,
});
