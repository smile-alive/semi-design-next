<script lang="ts" generics="Values extends Record<string, any> = any">
    import { onMount } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/form/constants';
    import { getFormApiProxyInternals } from '@fibrae/semi-foundation/form/form-api-proxy';
    import FormFoundation from '@fibrae/semi-foundation/form/foundation';
    import type { BaseFormAdapter, FormState } from '@fibrae/semi-foundation/form/interface';
    import '@fibrae/semi-foundation/form/form.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import Row from '../grid/row.svelte';
    import { setFormContext } from './context.js';
    import type { FormApi, FormProps } from './interface.js';
    import { cloneDeep, untrackMethods } from './utils.js';

    interface FormFoundationState {
        formState?: FormState;
    }

    type Adapter = BaseFormAdapter<FormProps<Values>, FormFoundationState, Values, SubmitEvent>;

    const defaults = useDefaultProps('Form');

    let {
        initValues,
        layout = defaults('layout', 'vertical'),
        labelPosition = defaults('labelPosition', 'top'),
        labelWidth = defaults('labelWidth'),
        labelAlign = defaults('labelAlign'),
        labelCol = defaults('labelCol'),
        wrapperCol = defaults('wrapperCol'),
        extraTextPosition = defaults('extraTextPosition'),
        allowEmpty = defaults('allowEmpty', false),
        autoScrollToError = defaults('autoScrollToError', false),
        showValidateIcon = defaults('showValidateIcon', true),
        disabled = defaults('disabled'),
        stopValidateWithError = defaults('stopValidateWithError'),
        trigger = defaults('trigger'),
        stopPropagation = defaults('stopPropagation'),
        validator = defaults('validator') as FormProps<Values>['validator'],
        form,
        id,
        onSubmit,
        onSubmitFail,
        onReset,
        onChange,
        onValueChange,
        onErrorChange,
        getFormApi: notifyFormApi,
        children,
        ...rest
    }: FormProps<Values> = $props();

    const uid = $props.id();
    let formElement = $state<HTMLFormElement>();

    // The props with their defaults resolved: the foundation reads them through getProps, the fields through the context
    const formProps: FormProps<Values> = {
        get initValues() {
            return initValues;
        },
        get layout() {
            return layout;
        },
        get labelPosition() {
            return labelPosition;
        },
        get labelWidth() {
            return labelWidth;
        },
        get labelAlign() {
            return labelAlign;
        },
        get labelCol() {
            return labelCol;
        },
        get wrapperCol() {
            return wrapperCol;
        },
        get extraTextPosition() {
            return extraTextPosition;
        },
        get allowEmpty() {
            return allowEmpty;
        },
        get autoScrollToError() {
            return autoScrollToError;
        },
        get showValidateIcon() {
            return showValidateIcon;
        },
        get disabled() {
            return disabled;
        },
        get stopValidateWithError() {
            return stopValidateWithError;
        },
        get trigger() {
            return trigger;
        },
        get stopPropagation() {
            return stopPropagation;
        },
        get validator() {
            return validator;
        },
        get id() {
            return id;
        },
    };

    const { foundation, states } = useFoundation<FormFoundation<SubmitEvent>, Adapter, FormProps<Values>, FormFoundationState>(
        FormFoundation,
        formProps,
        () => ({}),
        (base) => ({
            cloneDeep,
            notifySubmit: (values, e) => onSubmit?.(values, e),
            notifySubmitFail: (errors, values, e) => onSubmitFail?.(errors, values, e),
            forceUpdate: (formState, callback) => {
                base.setState({ formState }, callback);
                getFormApiProxyInternals(form)?.updateState(formState);
            },
            notifyChange: (formState) => onChange?.(formState),
            notifyValueChange: (values, changedValues) => onValueChange?.(values, changedValues),
            notifyErrorChange: (errors, changedError) => onErrorChange?.(errors, changedError),
            notifyReset: () => onReset?.(),
            getInitValues: () => initValues as Partial<Values>,
            getFormProps: (keys) => (keys ? Object.fromEntries(keys.map((key) => [key, formProps[key as keyof FormProps]])) : formProps),
            getFormElement: () => formElement ?? null,
        })
    );

    const initialFormState = foundation.getFormState();
    const formApi = untrackMethods(foundation.getFormApi()) as FormApi<Values>;
    const formId = $derived(id ?? uid);
    const formState = $derived((states().formState ?? initialFormState) as FormState<Values>);

    setFormContext({
        get formState() {
            return formState;
        },
        formProps,
        formApi,
        bridge: untrackMethods(foundation.getFieldBridge()),
    });

    const handleSubmit = (event: SubmitEvent) => {
        event.preventDefault();
        if (stopPropagation?.submit) {
            event.stopPropagation();
        }
        foundation.submit(event);
    };

    const handleReset = (event: Event) => {
        event.preventDefault();
        if (stopPropagation?.reset) {
            event.stopPropagation();
        }
        foundation.reset();
    };

    onMount(() => {
        notifyFormApi?.(formApi);
        getFormApiProxyInternals(form)?.bind(formApi);
        return () => getFormApiProxyInternals(form)?.unbind();
    });

    export function getFormApi() {
        return formApi;
    }
</script>

{#snippet formView()}
    <!-- rest comes after novalidate, so novalidate={false} turns it off -->
    <form bind:this={formElement} novalidate {...rest} class={[cssClasses.PREFIX, rest.class, { [`${cssClasses.PREFIX}-vertical`]: layout === 'vertical', [`${cssClasses.PREFIX}-horizontal`]: layout === 'horizontal' }]} id={formId} {...{ 'x-form-id': formId }} onreset={handleReset} onsubmit={handleSubmit}>
        {@render children?.({ formState, values: formState.values as Values, formApi })}
    </form>
{/snippet}

{#if labelCol && wrapperCol}
    <Row>{@render formView()}</Row>
{:else}
    {@render formView()}
{/if}
