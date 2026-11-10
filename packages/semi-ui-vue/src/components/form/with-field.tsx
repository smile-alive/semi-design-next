/** @jsxImportSource vue */
// JSX because withField is a component factory: the wrapped component is a runtime argument, which a template cannot name.
import { type Component, type IntrinsicElementAttributes, type PropType, type Slot, camelize, capitalize, createTextVNode, createVNode, defineComponent, mergeProps, shallowRef, toHandlerKey, watch } from 'vue';
import { cssClasses, type FieldPropKey } from '@fibrae/semi-foundation/components/form/constants';
import { getFieldAriaProps, resolveFieldView } from '@fibrae/semi-foundation/components/form/utils';
import warning from '@fibrae/semi-foundation/utils/warning';
import { handOn } from '../../utils/hand-on';
import { hasSlotContent } from '../../utils/slot-nodes';
import type { ValidateStatus } from '../input/interface';
import useField from './composables/use-field';
import FieldLayout from './field-layout.vue';
import type { CommonFieldProps, FieldComponent, FieldHandle, FieldLabel, WithFieldOptions } from './interface';

const prefix = cssClasses.PREFIX;
const shellSlots = new Set(['fieldLabel', 'labelExtra', 'helpText', 'extraText', 'error']);
const optionalBoolean = { type: Boolean, default: undefined };
type Listener = (...args: unknown[]) => void;

// Every shared field prop but helpText and extraText, which are slots here
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
    // a Standard Schema is an object (zod, valibot) or a function (arktype)
    validator: [Function, Object] as PropType<CommonFieldProps['validator']>,
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
} satisfies Record<keyof CommonFieldProps | Exclude<FieldPropKey, 'helpText' | 'extraText'>, unknown>;

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

            const forwardedSlots = (shell: boolean): Record<string, Slot | undefined> =>
                Object.fromEntries(
                    Object.entries(slots)
                        .filter(([key]) => !key.startsWith('_') && !(shell && shellSlots.has(key)))
                        .map(([key, slot]) => [key, handOn(slot)])
                );

            const reemit = (...args: unknown[]) => listeners().forEach((listener) => listener(...args));

            if (props.field == null && !shouldInject) {
                return () => createVNode(type, { ...controlAttrs(), id: props.id, name: props.name, [handlerKey]: reemit, ref: control }, forwardedSlots(false));
            }

            warning(props.field == null, "[Semi Form]: 'field' is required, please check your props of Field Component");

            const state = useField(props, {
                valuePath,
                onChange: (args, latestValues) => reemit(...args, latestValues),
            });

            if (!state) {
                return () => null;
            }

            const a11yId = () => props.id || state.generatedId;

            const fieldView = (hasPrefix: boolean, hasTrigger: boolean) => {
                const merged = state.merged.value;
                return resolveFieldView<FieldLabel>({
                    id: a11yId(),
                    field: props.field,
                    label: props.label,
                    noLabel: props.noLabel,
                    validateStatus: props.validateStatus,
                    status: state.snapshot.value.status,
                    labelPosition: merged.labelPosition,
                    labelCol: merged.labelCol,
                    wrapperCol: merged.wrapperCol,
                    formHasCols: merged.formHasCols,
                    insetSupported: supportsInset,
                    hasPrefix,
                    hasTrigger,
                });
            };

            watch(
                () => fieldView(false, false).warnInsetFallback,
                (warn) => warning(warn, `[Semi Form]: ${name} has no inset label, so Field "${props.field}" is laid out with labelPosition 'top'`),
                { immediate: true }
            );

            return () => {
                const { value, error, status } = state.snapshot.value;
                const merged = state.merged.value;
                const field = props.field ?? '';
                const { ids, labelConfig, labelText, labelPosition, insetShown, shownStatus, wrapInRow } = fieldView(hasSlotContent(slots.prefix), Boolean(slots.trigger));
                // the foundation never sets 'validating', the one status a control does not accept
                const blockStatus = shownStatus as ValidateStatus | undefined;
                const ownLayout = !state.inGroup && !props.pure;
                const shellLabel = ownLayout && !props.noLabel && labelPosition !== 'inset';
                const rulesRequired = state.rulesRequired.value;

                const injected: Record<string, unknown> = {
                    [valueKey]: value,
                    [handlerKey]: state.handleChange,
                    onBlur: state.handleBlur,
                    ...getFieldAriaProps({
                        own: attrs,
                        ids,
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
                        status,
                        shownStatus: blockStatus,
                    }),
                    ref: control,
                };
                if (props.name) injected.name = props.name;
                if (supportsStatus) injected.validateStatus = blockStatus;
                if (insetShown) injected.insetLabelId = ids.label;

                const pureClass = props.pure && [`${prefix}-field-pure`, { [`${prefix}-field-${props.name}`]: props.name }, props.fieldClassName];
                const controlSlots = {
                    ...forwardedSlots(true),
                    ...(insetShown && {
                        insetLabel: () => slots.fieldLabel?.() ?? [createTextVNode(String(labelText))],
                    }),
                };
                const renderControl = () => createVNode(type, mergeProps({ id: a11yId() }, controlAttrs(), { disabled: attrs.disabled ?? merged.disabled }, pureClass ? { class: pureClass } : {}, injected), controlSlots);
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
                          id: ids.label,
                          name: a11yId(),
                          text: labelText,
                      }
                    : undefined;

                return (
                    <FieldLayout
                        error={error}
                        errorMessageId={ids.errorMessage}
                        extraTextId={ids.extraText}
                        extraTextPosition={merged.extraTextPosition}
                        field={field}
                        fieldClassName={props.fieldClassName}
                        fieldStyle={props.fieldStyle}
                        helpTextId={ids.helpText}
                        label={label}
                        labelAlign={merged.labelAlign}
                        labelCol={merged.labelCol}
                        labelPosition={labelPosition}
                        name={props.name}
                        noErrorMessage={props.noErrorMessage}
                        row={wrapInRow}
                        showValidateIcon={merged.showValidateIcon}
                        validateStatus={blockStatus}
                        wrapperCol={merged.wrapperCol}
                    >
                        {{
                            default: renderControl,
                            label: handOn(slots.fieldLabel),
                            labelExtra: handOn(slots.labelExtra),
                            helpText: handOn(slots.helpText),
                            extraText: handOn(slots.extraText),
                            error: handOn(slots.error),
                        }}
                    </FieldLayout>
                );
            };
        },
    });
}
