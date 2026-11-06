<script setup lang="ts" generic="Values extends Record<string, any> = Record<string, any>, Output = Values">
    import { computed, onBeforeUnmount, onMounted, toRaw, useId, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/form/constants';
    import { getFormApiProxyInternals } from '@fibrae/semi-foundation/form/form-api-proxy';
    import FormFoundation from '@fibrae/semi-foundation/form/foundation';
    import type { AllErrors, BaseFormAdapter, FormFoundationState, FormState } from '@fibrae/semi-foundation/form/interface';
    import '@fibrae/semi-foundation/form/form.scss';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import SlotFragment from '../_base/slot-fragment';
    import useFoundation from '../_base/use-foundation';
    import Row from '../grid/row.vue';
    import useLocale from '../locale/use-locale';
    import { provideFormContext } from './context';
    import type { AllFormProps, FormApi, FormEmits, FormHandle, FormProps, FormSlots } from './interface';
    import { cloneDeep } from './utils';

    type Adapter = BaseFormAdapter<AllFormProps<Values, Output>, Values, SubmitEvent>;

    // the root may be a Row, so attrs are bound to the form element explicitly
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<FormProps<Values, Output> & /* @vue-ignore */ ElementProps<'form', keyof FormProps<Values, Output> | EmitHandlers<FormEmits<Values, Output>>>>(), {
        layout: () => semiDefault('Form', 'layout', 'vertical'),
        labelPosition: () => semiDefault('Form', 'labelPosition', 'top'),
        labelWidth: semiGlobalDefault('Form', 'labelWidth'),
        labelAlign: semiGlobalDefault('Form', 'labelAlign'),
        labelCol: semiGlobalDefault('Form', 'labelCol'),
        wrapperCol: semiGlobalDefault('Form', 'wrapperCol'),
        extraTextPosition: semiGlobalDefault('Form', 'extraTextPosition'),
        allowEmpty: () => semiDefault('Form', 'allowEmpty', false),
        autoScrollToError: () => semiDefault('Form', 'autoScrollToError', false),
        showValidateIcon: () => semiDefault('Form', 'showValidateIcon', true),
        disabled: semiGlobalDefault('Form', 'disabled'),
        stopValidateWithError: semiGlobalDefault('Form', 'stopValidateWithError'),
        trigger: semiGlobalDefault('Form', 'trigger'),
        stopPropagation: semiGlobalDefault('Form', 'stopPropagation'),
        validator: undefined,
        schema: undefined,
        schemaDebounce: semiGlobalDefault('Form', 'schemaDebounce'),
        keepState: () => semiDefault('Form', 'keepState', true),
    });

    const emit = defineEmits<FormEmits<Values, Output>>();
    defineSlots<FormSlots<Values, Output>>();

    const semi = useSemiGlobal();
    const locale = useLocale('Form');

    const generatedId = useId();
    const formElement = useTemplateRef('form');

    const prefix = cssClasses.PREFIX;
    const formId = computed(() => props.id ?? generatedId);

    const formProps = computed<AllFormProps<Values, Output>>(() => ({
        ...props,
        validator: props.validator ?? readSemiDefault(semi, 'Form', 'validator'),
        // Zod keeps non-configurable properties a deep reactive proxy (ref, reactive, data) breaks, so validate runs on the raw schema
        schema: toRaw(props.schema) ?? readSemiDefault(semi, 'Form', 'schema'),
    }));

    const pickFormProps = (keys?: string[]) => (keys ? Object.fromEntries(keys.map((key) => [key, formProps.value[key as keyof AllFormProps]])) : formProps.value);

    const { foundation, state } = useFoundation<FormFoundation<SubmitEvent>, Adapter, AllFormProps<Values, Output>, FormFoundationState>(
        FormFoundation,
        props,
        (view) => FormFoundation.getInitialState(view),
        (base) => ({
            cloneDeep,
            notifySubmit: (values, e) => emit('submit', values as Output, e),
            notifySubmitFail: (errors, values, e) => emit('submitFail', errors as Partial<AllErrors<Values>>, values, e),
            getLocale: () => locale.value.locale,
            forceUpdate: (formState, callback) => {
                base.setState({ formState }, callback);
                getFormApiProxyInternals(props.form)?.updateState(formState);
            },
            notifyChange: (formState) => emit('change', formState),
            notifyValueChange: (values, changedValues) => emit('valueChange', values, changedValues),
            notifyErrorChange: (errors, changedError) => emit('errorChange', errors, changedError),
            notifyReset: () => emit('reset'),
            getFormProps: pickFormProps,
            getFormElement: () => formElement.value,
        }),
        { props: { validator: () => formProps.value.validator, schema: () => formProps.value.schema } }
    );

    const formState = computed(() => state.value.formState as FormState<Values>);
    const values = computed(() => formState.value.values as Values);
    const formApi = foundation.getFormApi() as FormApi<Values, Output>;

    provideFormContext({ formState, formProps, formApi, bridge: foundation.getFieldBridge() });

    const onSubmit = (e: SubmitEvent) => {
        if (props.stopPropagation?.submit) {
            e.stopPropagation();
        }
        foundation.submit(e);
    };

    const onReset = (e: Event) => {
        if (props.stopPropagation?.reset) {
            e.stopPropagation();
        }
        foundation.reset();
    };

    onMounted(() => {
        emit('getFormApi', formApi);
        getFormApiProxyInternals(props.form)?.bind(formApi);
    });

    onBeforeUnmount(() => getFormApiProxyInternals(props.form)?.unbind());

    defineExpose<FormHandle<Values, Output>>({ formApi });
</script>

<template>
    <component :is="props.labelCol && props.wrapperCol ? Row : SlotFragment">
        <!-- $attrs come after novalidate so that :novalidate="false" turns it off -->
        <form v-bind="{ novalidate: true, ...$attrs }" :id="formId" ref="form" :class="[prefix, { [`${prefix}-vertical`]: props.layout === 'vertical', [`${prefix}-horizontal`]: props.layout === 'horizontal' }]" :x-form-id="formId" @reset.prevent="onReset" @submit.prevent="onSubmit">
            <slot :formApi="formApi" :formState="formState" :values="values" />
        </form>
    </component>
</template>
