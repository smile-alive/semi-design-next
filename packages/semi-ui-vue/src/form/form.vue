<script setup lang="ts" generic="Values extends Record<string, any> = Record<string, any>">
    import { computed, onBeforeUnmount, onMounted, shallowRef, useId, useTemplateRef, watch } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/form/constants';
    import FormFoundation from '@fibrae/semi-foundation/form/foundation';
    import type { BaseFormAdapter, FormState } from '@fibrae/semi-foundation/form/interface';
    import '@fibrae/semi-foundation/form/form.scss';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import SlotFragment from '../_base/slot-fragment';
    import useFoundation from '../_base/use-foundation';
    import Row from '../grid/row.vue';
    import { provideFormContext } from './context';
    import type { FormApi, FormEmits, FormHandle, FormProps, FormSlots } from './interface';
    import { cloneDeep } from './utils';

    interface FormFoundationState {
        formState?: FormState;
    }

    type Adapter = BaseFormAdapter<FormProps<Values>, FormFoundationState, Values, SubmitEvent>;

    // the root may be a Row, so attrs are bound to the form element explicitly
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<FormProps<Values> & /* @vue-ignore */ ElementProps<'form', keyof FormProps<Values> | EmitHandlers<FormEmits<Values>>>>(), {
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
    });

    const emit = defineEmits<FormEmits<Values>>();
    defineSlots<FormSlots<Values>>();

    const semi = useSemiGlobal();

    const generatedId = useId();
    const afterUpdateTick = shallowRef(0);
    const formElement = useTemplateRef('form');

    const prefix = cssClasses.PREFIX;
    const formId = computed(() => props.id ?? generatedId);

    const formProps = computed<FormProps<Values>>(() => ({
        ...props,
        validator: props.validator ?? readSemiDefault(semi, 'Form', 'validator'),
    }));

    // Fields renamed by the render (shifted ArrayField rows) register in post-flush watchers that run after the Form's own,
    // so callbacks run in a post-flush watcher queued by the first one, in the next pass of the same flush.
    const afterUpdate: (() => void)[] = [];

    const pickFormProps = (keys?: string[]) => (keys ? Object.fromEntries(keys.map((key) => [key, formProps.value[key as keyof FormProps]])) : formProps.value);

    watch(
        afterUpdateTick,
        () => {
            afterUpdate.splice(0).forEach((callback) => callback());
        },
        { flush: 'post' }
    );

    const { foundation, state } = useFoundation<FormFoundation<SubmitEvent>, Adapter, FormProps<Values>, FormFoundationState>(
        FormFoundation,
        props,
        () => ({}),
        (base) => ({
            cloneDeep,
            notifySubmit: (values, e) => emit('submit', values, e),
            notifySubmitFail: (errors, values, e) => emit('submitFail', errors, values, e),
            forceUpdate: (formState, callback) => {
                base.setState(
                    { formState },
                    callback &&
                        (() => {
                            afterUpdate.push(callback);
                            afterUpdateTick.value++;
                        })
                );
                props.form?.__updateState?.(formState);
            },
            notifyChange: (formState) => emit('change', formState),
            notifyValueChange: (values, changedValues) => emit('valueChange', values, changedValues),
            notifyErrorChange: (errors, changedError) => emit('errorChange', errors, changedError),
            notifyReset: () => emit('reset'),
            getInitValues: () => props.initValues as Partial<Values>,
            getFormProps: pickFormProps,
            getFormElement: () => formElement.value,
        }),
        { props: { validator: () => formProps.value.validator } }
    );

    const initialFormState = foundation.getFormState();
    const formState = computed<FormState<Values>>(() => state.value.formState ?? initialFormState);
    const values = computed(() => formState.value.values as Values);
    const formApi = foundation.getFormApi() as FormApi<Values>;

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
        props.form?.__bind?.(formApi);
    });

    onBeforeUnmount(() => props.form?.__unbind?.());

    defineExpose<FormHandle<Values>>({ formApi });
</script>

<template>
    <component :is="props.labelCol && props.wrapperCol ? Row : SlotFragment">
        <!-- $attrs come after novalidate so that :novalidate="false" turns it off -->
        <form v-bind="{ novalidate: true, ...$attrs }" :id="formId" ref="form" :class="[prefix, { [`${prefix}-vertical`]: props.layout === 'vertical', [`${prefix}-horizontal`]: props.layout === 'horizontal' }]" :x-form-id="formId" @reset.prevent="onReset" @submit.prevent="onSubmit">
            <slot :formApi="formApi" :formState="formState" :values="values" />
        </form>
    </component>
</template>
