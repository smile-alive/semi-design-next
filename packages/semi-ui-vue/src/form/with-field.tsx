/** @jsxImportSource vue */
// JSX because withField is a component factory: the wrapped component is a runtime argument, which a template cannot name.
import { type Component, type IntrinsicElementAttributes, type PropType, type Slot, camelize, capitalize, createTextVNode, createVNode, defineComponent, mergeProps, shallowRef, toHandlerKey, watch } from 'vue';
import { cssClasses } from '@fibrae/semi-foundation/form/constants';
import { getFieldAriaProps, isRequired } from '@fibrae/semi-foundation/form/utils';
import warning from '@fibrae/semi-foundation/utils/warning';
import { hasSlotContent } from '../_base/slot-nodes';
import type { ValidateStatus } from '../input/interface';
import FieldLayout from './field-layout.vue';
import type { CommonFieldProps, FieldComponent, FieldHandle, WithFieldOptions } from './interface';
import useField from './use-field';
import { hasErrorContent, isLabelConfig } from './utils';

const prefix = cssClasses.PREFIX;
const shellSlots = new Set(['fieldLabel', 'labelExtra', 'helpText', 'extraText', 'error']);
const optionalBoolean = { type: Boolean, default: undefined };
type Listener = (...args: unknown[]) => void;

const fieldProps = {
    field: String,
    label: [String, Number, Object] as PropType<CommonFieldProps['label']>,
    labelPosition: String as PropType<CommonFieldProps['labelPosition']>,
    labelAlign: String as PropType<CommonFieldProps['labelAlign']>,
    labelWidth: [Number, String],
    labelCol: Object as PropType<CommonFieldProps['labelCol']>,
    wrapperCol: Object as PropType<CommonFieldProps['wrapperCol']>,
    noLabel: optionalBoolean,
    noErrorMessage: optionalBoolean,
    pure: optionalBoolean,
    keepState: optionalBoolean,
    allowEmptyString: optionalBoolean,
    allowEmpty: optionalBoolean,
    emptyValue: null,
    initValue: null,
    rules: Array as PropType<CommonFieldProps['rules']>,
    validator: Function as PropType<CommonFieldProps['validator']>,
    transform: Function as PropType<CommonFieldProps['transform']>,
    convert: Function as PropType<CommonFieldProps['convert']>,
    trigger: [String, Array] as PropType<CommonFieldProps['trigger']>,
    stopValidateWithError: optionalBoolean,
    extraTextPosition: String as PropType<CommonFieldProps['extraTextPosition']>,
    validateStatus: String as PropType<CommonFieldProps['validateStatus']>,
    name: String,
    id: String,
    fieldClassName: String,
    fieldStyle: [String, Object, Array] as PropType<CommonFieldProps['fieldStyle']>,
} satisfies Record<keyof CommonFieldProps, unknown>;

/** Whether the component declares the prop; a string tag or a component without props declares none */
function declaresProp(component: unknown, key: string) {
    const declared = (component as { props?: unknown } | null)?.props;
    const keys = Array.isArray(declared) ? (declared as string[]) : Object.keys(declared ?? {});
    return keys.some((name) => camelize(name) === key);
}

function componentName(component: unknown): string {
    if (typeof component === 'string') return capitalize(component);
    const options = component as { name?: string; __name?: string };
    return capitalize(camelize(options.name ?? options.__name ?? ''));
}

/**
 * Wraps a component as a form field: the Form owns its value, the field re-emits its change with the latest form
 * values appended, and the shell adds the Label, ErrorMessage and extra text.
 */
export default function withField<K extends keyof IntrinsicElementAttributes, V extends string = 'modelValue', E extends string = 'change'>(component: K, opts?: WithFieldOptions<V, E>): FieldComponent<K, V, E>;
export default function withField<C, V extends string = 'modelValue', E extends string = 'change'>(component: C, opts?: WithFieldOptions<V, E>): FieldComponent<C, V, E>;
export default function withField(component: unknown, opts: WithFieldOptions<string, string> = {}): unknown {
    const valueKey = opts.valueKey ?? 'modelValue';
    const changeEvent = opts.onKeyChangeFnName ?? 'change';
    const handlerKey = toHandlerKey(camelize(changeEvent));
    const valuePath = opts.valuePath ?? '';
    const shouldInject = opts.shouldInject ?? true;
    const name = `Form${componentName(component)}`;
    // otherwise they would land on the DOM as attributes
    const supportsInset = declaresProp(component, 'insetLabelId');
    const supportsStatus = declaresProp(component, 'validateStatus');
    const valueKeys = new Set([valueKey, `onUpdate:${valueKey}`, 'defaultValue', 'defaultChecked', `default${capitalize(valueKey)}`]);
    const isValueKey = (key: string) => valueKeys.has(camelize(key));
    const type = component as string | Component;

    return defineComponent({
        name,
        inheritAttrs: false,
        // a prop, not an emit: Vue routes an emit listener's error to app.config.errorHandler and never rethrows it in
        // production, so the Form could not roll the value back
        props: { ...fieldProps, [handlerKey]: [Function, Array] as PropType<Listener | Listener[]> },
        setup(rawProps, { attrs, slots, expose }) {
            const props = rawProps as Readonly<Partial<CommonFieldProps>>;

            const control = shallowRef<unknown>(null);

            const listeners = () => [(rawProps as Record<string, Listener | Listener[] | undefined>)[handlerKey] ?? []].flat();

            expose({
                get control() {
                    return control.value;
                },
            } satisfies FieldHandle);

            const stripped = Object.keys(attrs).filter(isValueKey);

            warning(stripped.length > 0, `[Semi Form]: ${name} takes its value from the Form, so ${stripped.join(', ')} is ignored; use initValue or the formApi instead`);

            const controlAttrs = () => Object.fromEntries(Object.entries(attrs).filter(([key]) => !isValueKey(key)));

            const forwardedSlots = (shell: boolean): Record<string, Slot | undefined> => Object.fromEntries(Object.entries(slots).filter(([key]) => !key.startsWith('_') && !(shell && shellSlots.has(key))));

            const reemit = (...args: unknown[]) => listeners().forEach((listener) => listener(...args));

            if (props.field === undefined && !shouldInject) {
                return () => createVNode(type, { ...controlAttrs(), id: props.id, name: props.name, [handlerKey]: reemit, ref: control }, forwardedSlots(false));
            }

            warning(props.field === undefined, "[Semi Form]: 'field' is required, please check your props of Field Component");

            const state = useField(props, {
                valuePath,
                onChange: (args, latestValues) => reemit(...args, latestValues),
            });

            if (!state) {
                return () => null;
            }

            watch(
                () => state.merged.value.labelPosition === 'inset' && !props.noLabel,
                (inset) => warning(inset && !supportsInset, `[Semi Form]: ${name} has no inset label, so Field "${props.field}" is laid out with labelPosition 'top'`),
                { immediate: true }
            );

            return () => {
                const { value, error, status } = state.snapshot.value;
                const merged = state.merged.value;
                const field = props.field ?? '';
                const a11yId = props.id || state.generatedId;
                const labelId = `${a11yId}-label`;
                const helpTextId = `${a11yId}-helpText`;
                const extraTextId = `${a11yId}-extraText`;
                const errorMessageId = `${a11yId}-errormessage`;
                // the foundation never sets 'validating', the one status a control does not accept
                const blockStatus = (props.validateStatus || status) as ValidateStatus | undefined;
                const labelConfig = isLabelConfig(props.label) ? props.label : undefined;
                const labelText = (isLabelConfig(props.label) ? props.label.text : props.label) || field;
                const insetPosition = merged.labelPosition === 'inset';
                // a prefix or a custom trigger takes the inset label's place, so the label goes on top
                const insetFallback = insetPosition && (!supportsInset || hasSlotContent(slots.prefix) || Boolean(slots.trigger));
                const insetShown = insetPosition && !insetFallback && !props.noLabel;
                const labelPosition = insetFallback ? 'top' : merged.labelPosition;
                const ownLayout = !state.inGroup && !props.pure;
                const shellLabel = ownLayout && !props.noLabel && labelPosition !== 'inset';
                const rulesRequired = isRequired(props.rules);

                const injected: Record<string, unknown> = {
                    [valueKey]: value,
                    [handlerKey]: state.handleChange,
                    onBlur: state.handleBlur,
                    ...getFieldAriaProps({
                        own: attrs,
                        ids: { label: labelId, helpText: helpTextId, extraText: extraTextId, errorMessage: errorMessageId },
                        rulesRequired,
                        label: labelConfig,
                        labelPosition,
                        noLabel: props.noLabel,
                        noErrorMessage: props.noErrorMessage,
                        pure: props.pure,
                        inGroup: state.inGroup,
                        hasHelpText: hasSlotContent(slots.helpText),
                        hasExtraText: hasSlotContent(slots.extraText),
                        error,
                        errorHasContent: hasErrorContent(error),
                        status,
                        shownStatus: blockStatus,
                    }),
                    ref: control,
                };
                if (props.name) injected.name = props.name;
                if (supportsStatus) injected.validateStatus = blockStatus;
                if (insetShown) injected.insetLabelId = labelId;

                const pureClass = props.pure && [`${prefix}-field-pure`, { [`${prefix}-field-${props.name}`]: props.name }, props.fieldClassName];
                const controlSlots = {
                    ...forwardedSlots(true),
                    ...(insetShown && {
                        insetLabel: () => slots.fieldLabel?.() ?? [createTextVNode(String(labelText))],
                    }),
                };
                const renderControl = () => createVNode(type, mergeProps({ id: a11yId }, controlAttrs(), { disabled: attrs.disabled ?? merged.disabled }, pureClass ? { class: pureClass } : {}, injected), controlSlots);
                if (!ownLayout) {
                    return renderControl();
                }

                // id, name and text come last: they must match what the control references
                const label = shellLabel
                    ? {
                          required: rulesRequired,
                          align: merged.labelAlign,
                          width: merged.labelWidth,
                          ...labelConfig,
                          id: labelId,
                          name: a11yId,
                          text: labelText,
                      }
                    : undefined;

                return (
                    <FieldLayout
                        error={error}
                        errorMessageId={errorMessageId}
                        extraTextId={extraTextId}
                        extraTextPosition={merged.extraTextPosition}
                        field={field}
                        fieldClassName={props.fieldClassName}
                        fieldStyle={props.fieldStyle}
                        helpTextId={helpTextId}
                        label={label}
                        labelAlign={merged.labelAlign}
                        labelCol={merged.labelCol}
                        labelPosition={labelPosition}
                        name={props.name}
                        noErrorMessage={props.noErrorMessage}
                        row={Boolean(merged.labelCol && merged.wrapperCol) && !merged.formHasCols}
                        showValidateIcon={merged.showValidateIcon}
                        validateStatus={blockStatus}
                        wrapperCol={merged.wrapperCol}
                    >
                        {{
                            default: renderControl,
                            label: slots.fieldLabel,
                            labelExtra: slots.labelExtra,
                            helpText: slots.helpText,
                            extraText: slots.extraText,
                            error: slots.error,
                        }}
                    </FieldLayout>
                );
            };
        },
    });
}
