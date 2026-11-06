import { type JSX, Match, Show, Switch, createUniqueId, onCleanup, onMount, splitProps, untrack } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/form/constants';
import { getFormApiProxyInternals } from '@fibrae/semi-foundation/form/form-api-proxy';
import FormFoundation from '@fibrae/semi-foundation/form/foundation';
import type { AllErrors, BaseFormAdapter, FormFoundationState } from '@fibrae/semi-foundation/form/interface';
import warning from '@fibrae/semi-foundation/utils/warning';
import '@fibrae/semi-foundation/form/form.scss';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import { Row } from '../grid';
import useLocale from '../locale/use-locale';
import { type FormContextValue, FormContext } from './context';
import type { FormApi, FormElement, FormProps, FormRenderProps, FormState } from './interface';
import { batchMethods, cloneDeep } from './utils';

const prefix = cssClasses.PREFIX;

const defaultProps = {
    layout: 'vertical',
    labelPosition: 'top',
    allowEmpty: false,
    autoScrollToError: false,
    keepState: true,
    schemaDebounce: 0,
    showValidateIcon: true,
} satisfies Partial<FormProps>;

function pickFormProps(props: Record<string, any>, keys?: string[]) {
    return keys ? Object.fromEntries(keys.map((key) => [key, props[key]])) : props;
}

export default function Form<Values extends Record<string, any> = any, Output = Values>(rawProps: FormProps<Values, Output>) {
    type Foundation = FormFoundation<SubmitEvent>;
    type Adapter = BaseFormAdapter<FormProps<Values, Output>, Values, SubmitEvent>;

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
        'keepState',
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
        'schema',
        'schemaDebounce',
        'showValidateIcon',
        'stopPropagation',
        'stopValidateWithError',
        'trigger',
        'validator',
        'wrapperCol',
    ]);

    const locale = useLocale('Form');

    const generatedId = createUniqueId();
    let formElement: HTMLFormElement | undefined;

    const { foundation, state } = useFoundation<Foundation, Adapter, FormProps<Values, Output>, FormFoundationState>(
        FormFoundation,
        props,
        (view) => FormFoundation.getInitialState(view),
        (base) => ({
            cloneDeep,
            getLocale: () => locale().locale,
            notifySubmit: (values, e) => local.onSubmit?.(values, e),
            notifySubmitFail: (errors, values, e) => local.onSubmitFail?.(errors as Partial<AllErrors<Values>>, values, e),
            forceUpdate: (formState, callback) => {
                base.setState({ formState }, callback);
                getFormApiProxyInternals(local.form)?.updateState(formState);
            },
            notifyChange: (formState) => local.onChange?.(formState),
            notifyValueChange: (values, changedValues) => local.onValueChange?.(values, changedValues),
            notifyErrorChange: (errors, changedError) => local.onErrorChange?.(errors, changedError),
            notifyReset: () => local.onReset?.(),
            getFormProps: (keys) => pickFormProps(props, keys),
            getFormElement: () => formElement ?? null,
        })
    );

    const formApi = batchMethods(foundation.getFormApi()) as FormApi<Values, Output>;

    const formId = () => local.id ?? generatedId;

    const formState = () => state().formState;

    // read lazily, so a render function or component that reads them in its JSX follows the form state
    const renderProps: FormRenderProps<Values, Output> = {
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
                local.ref?.(formElement as FormElement<Values, Output>);
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

    // Built before the onMount below, so getFormApi and the useForm api bind with the fields inside registered
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
        getFormApiProxyInternals(local.form)?.bind(formApi);
        onCleanup(() => {
            // Solid disposes the fields before the host destroys the foundation, and a field's cleanup batches, which
            // flushes the commit queue at once: without this the unregistering would settle as if the Form stayed
            foundation.destroy();
            getFormApiProxyInternals(local.form)?.unbind();
        });
    });

    return view;
}
