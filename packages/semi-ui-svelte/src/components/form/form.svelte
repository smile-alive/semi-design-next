<script lang="ts" generics="Values extends Record<string, any> = any, Output = Values">
    import { onMount } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
    import { getFormApiProxyInternals } from '@fibrae/semi-foundation/components/form/form-api-proxy';
    import FormFoundation from '@fibrae/semi-foundation/components/form/foundation';
    import type { BaseFormAdapter, FormFoundationState, FormState } from '@fibrae/semi-foundation/components/form/interface';
    import '@fibrae/semi-foundation/components/form/form.scss';
    import useDefaultProps from '../../base/use-default-props.js';
    import useFoundation from '../../base/use-foundation.svelte.js';
    import Row from '../grid/row.svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import { setFormContext } from './context.js';
    import type { AllFormProps, FormApi, FormProps } from './interface.js';
    import { cloneDeep, untrackMethods } from './utils.js';

    type Adapter = BaseFormAdapter<AllFormProps<Values, Output>, Values, SubmitEvent>;

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
        validator = defaults('validator') as AllFormProps<Values, Output>['validator'],
        schema = defaults('schema') as AllFormProps<Values, Output>['schema'],
        schemaDebounce = defaults('schemaDebounce', 0),
        keepState = defaults('keepState', true),
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
    }: FormProps<Values, Output> = $props();

    const locale = useLocale('Form');

    const uid = $props.id();
    let formElement = $state<HTMLFormElement>();

    const formProps: AllFormProps<Values, Output> = {
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
        get schema() {
            return schema;
        },
        get schemaDebounce() {
            return schemaDebounce;
        },
        get keepState() {
            return keepState;
        },
        get id() {
            return id;
        },
        get form() {
            return form;
        },
    };

    const { foundation, states } = useFoundation<FormFoundation<SubmitEvent>, Adapter, AllFormProps<Values, Output>, FormFoundationState>(
        FormFoundation,
        formProps,
        (view) => FormFoundation.getInitialState(view),
        () => ({
            cloneDeep,
            getLocale: () => locale().locale,
            notifySubmit: (values, e) => onSubmit?.(values, e),
            notifySubmitFail: (errors, values, e) => onSubmitFail?.(errors, values, e),
            notifyChange: (formState) => onChange?.(formState),
            notifyValueChange: (values, changedValues) => onValueChange?.(values, changedValues),
            notifyErrorChange: (errors, changedError) => onErrorChange?.(errors, changedError),
            notifyReset: () => onReset?.(),
            getFormElement: () => formElement ?? null,
        })
    );

    const formApi = untrackMethods(foundation.getFormApi()) as FormApi<Values, Output>;
    const formId = $derived(id ?? uid);
    const formState = $derived(states().formState as FormState<Values>);

    setFormContext({
        get formState() {
            return formState;
        },
        formProps,
        formApi,
        bridge: untrackMethods(foundation.getFieldBridge()),
    });

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
    <form
        bind:this={formElement}
        novalidate
        {...rest}
        class={[cssClasses.PREFIX, rest.class, { [`${cssClasses.PREFIX}-vertical`]: layout === 'vertical', [`${cssClasses.PREFIX}-horizontal`]: layout === 'horizontal' }]}
        id={formId}
        {...{ 'x-form-id': formId }}
        onreset={foundation.handleResetEvent}
        onsubmit={foundation.handleSubmitEvent}
    >
        {@render children?.({ formState, values: formState.values as Values, formApi })}
    </form>
{/snippet}

{#if labelCol && wrapperCol}
    <Row>{@render formView()}</Row>
{:else}
    {@render formView()}
{/if}
