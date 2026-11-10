import { type JSX, type ValidComponent, Show, children, createEffect, createMemo, createSignal, createUniqueId, mergeProps, on, onCleanup, onMount, splitProps, untrack } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses, FIELD_PROP_KEYS } from '@fibrae/semi-foundation/components/form/constants';
import FieldStore from '@fibrae/semi-foundation/components/form/field-store';
import type { ExclusiveFieldValidation, FieldRegistration } from '@fibrae/semi-foundation/components/form/interface';
import { createFieldRegistration, getFieldAriaProps, isRequiredByRules, mergeFieldConfig, resolveFieldInitValue, resolveFieldView } from '@fibrae/semi-foundation/components/form/utils';
import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
import warning from '@fibrae/semi-foundation/utils/warning';
import useWatch from '../../primitives/use-watch';
import hasContent from '../../utils/has-content';
import isMarkup from '../../utils/is-markup';
import { type FormContextValue, useArrayFieldContext, useFormContext, useFormInputGroupContext } from './context';
import ErrorMessage, { type ErrorMessageInternalProps } from './error-message';
import FieldGrid from './field-grid';
import type { CommonFieldProps, FieldProps } from './interface';
import Label, { type LabelProps } from './label';
import { cloneDeep, invoke } from './utils';

const prefix = cssClasses.PREFIX;

const InternalErrorMessage = ErrorMessage as (props: ErrorMessageInternalProps) => JSX.Element;

export interface WithFieldOption {
    valueKey?: string;
    onKeyChangeFnName?: string;
    /** Where the value sits in the handler's first argument, such as `target.checked` for an event */
    valuePath?: string;
    /** false: without `field` the component renders bare, as a Checkbox or Radio inside its group */
    shouldInject?: boolean;
}

// the field sets id and name on the control itself
const fieldKeys = [...FIELD_PROP_KEYS, 'id', 'name'] as const satisfies readonly (keyof (CommonFieldProps & ExclusiveFieldValidation))[];

// The value comes in through initValue only, so the props that would give the control a second source of truth are
// dropped before the rest reaches it
const valueKeys = ['checked', 'defaultChecked', 'defaultValue'] as const;

type AnyProps = Record<string, any>;

function displayName(component: ValidComponent) {
    const name = typeof component === 'string' ? '' : component.name;
    return name ? `SemiField${name}` : 'SemiField';
}

function createField(component: ValidComponent, opts: WithFieldOption, insetLabel: boolean) {
    const valueKey = opts.valueKey ?? 'value';
    const changeKey = opts.onKeyChangeFnName ?? 'onChange';
    const valuePath = opts.valuePath ?? '';
    const shouldInject = opts.shouldInject ?? true;
    const name = displayName(component);

    function InjectedField(props: AnyProps) {
        const inForm = Boolean(useFormContext());

        warning(!inForm, '[Semi Form]: Field Component must be use inside the Form, please check your dom declaration');

        return (
            <Show when={inForm}>
                <FormField {...props} />
            </Show>
        );
    }

    function FormField(props: AnyProps) {
        const [local, rest] = splitProps(props, [...fieldKeys, ...valueKeys, valueKey, changeKey, 'onBlur', 'prefix']) as [AnyProps, AnyProps];

        const form = useFormContext() as FormContextValue;
        const arrayField = useArrayFieldContext();
        const group = useFormInputGroupContext();

        // two Forms on a page may share a field name, so the name cannot be the DOM id
        const generatedId = createUniqueId();

        const merged = createMemo(() => mergeFieldConfig(local, form.formProps));
        const fieldPath = createMemo(() => local.field as string | undefined);
        // each read of a JSX prop creates its nodes again, so these are read once; the control gets the resolved prefix
        const prefixContent = children(() => local.prefix as JSX.Element);

        const formValues = () => arrayField?.values() ?? form.formState().values ?? {};

        const readInitValue = (field?: string) => resolveFieldInitValue(local.initValue, field === undefined ? undefined : ObjectUtil.get(formValues(), field), arrayField?.shouldUseInitValue() ?? true);

        // read once, from the form state the field is created in: a row of a mounting ArrayField finds its value
        // only before the fields before it register
        const mountedInitValue = untrack(() => readInitValue(local.field));

        // copied once: the field's value must not share objects with the caller's initValue. validateStatus only
        // overrides the shown status, so it does not seed the field's own one.
        const store = new FieldStore({ value: cloneDeep(mountedInitValue) });
        const [snapshot, setSnapshot] = createSignal(store.getSnapshot());

        const createRegistration = (field: string, initValue: unknown) => createFieldRegistration({ id: generatedId, field, store, initValue, valuePath, inArrayField: Boolean(arrayField) }, () => ({ props: local, formProps: form.formProps, arrayFieldKeepState: arrayField?.keepState() }));

        // a wrapped component may report a change before the field registers
        let registration = untrack(() => createRegistration(local.field, mountedInitValue));
        let registered: { field: string; registration: FieldRegistration; leaveGroup?: () => void } | undefined;

        const a11yId = () => local.id || generatedId;
        const viewInput = () => ({
            id: a11yId(),
            field: local.field,
            noLabel: local.noLabel,
            validateStatus: local.validateStatus,
            status: snapshot().status,
            labelPosition: merged().labelPosition,
            labelCol: merged().labelCol,
            wrapperCol: merged().wrapperCol,
            formHasCols: Boolean(form.formProps.labelCol && form.formProps.wrapperCol),
            insetSupported: insetLabel,
            hasPrefix: hasContent(prefixContent()),
            hasTrigger: typeof rest.triggerRender === 'function',
            isNode: isMarkup,
        });
        // the position needs no label, and the label is read only where it renders
        const labelPosition = createMemo(() => resolveFieldView(viewInput()).labelPosition);
        const rulesRequired = () => isRequiredByRules(form.formProps, local.rules);

        // A layout creates only the texts it renders: nodes created for a text left out have no server markup to hydrate
        const ownLayout = () => !group && !local.pure;
        // an error replaces the help text, `['']` (failed without a text) included
        const errorReplacesHelp = createMemo(() => Boolean(snapshot().error));
        const extraTextShown = () => merged().extraTextPosition === 'middle' || merged().extraTextPosition === 'bottom';
        const label = children(() => (!local.noLabel && (labelPosition() === 'inset' || ownLayout()) ? (local.label as JSX.Element) : undefined));
        const helpText = children(() => (ownLayout() && !local.noErrorMessage && !errorReplacesHelp() ? (local.helpText as JSX.Element) : undefined));
        const extraText = children(() => (ownLayout() && extraTextShown() ? (local.extraText as JSX.Element) : undefined));
        const view = createMemo(() => resolveFieldView<LabelProps, JSX.Element>({ ...viewInput(), label: label() }));

        const ownAria = () => {
            if (!group) {
                return rest;
            }
            const groupAria = group.aria();
            return {
                'aria-required': rest['aria-required'],
                'aria-labelledby': joinIds(rest['aria-labelledby'], groupAria.labelledby),
                'aria-describedby': joinIds(rest['aria-describedby'], groupAria.describedby),
                'aria-errormessage': groupAria.errormessage,
            };
        };

        const aria = createMemo((): AnyProps => {
            const { error, status } = snapshot();
            const own = ownAria();
            return {
                'aria-labelledby': own['aria-labelledby'],
                'aria-describedby': own['aria-describedby'],
                'aria-errormessage': own['aria-errormessage'],
                ...getFieldAriaProps({
                    own,
                    ids: view().ids,
                    rulesRequired: rulesRequired(),
                    label: view().labelConfig,
                    labelPosition: labelPosition(),
                    noLabel: local.noLabel,
                    noErrorMessage: local.noErrorMessage,
                    pure: local.pure,
                    inGroup: Boolean(group),
                    hasHelpText: hasContent(helpText()),
                    hasExtraText: hasContent(extraText()),
                    error,
                    status,
                    shownStatus: view().shownStatus,
                }),
            };
        });

        const register = (initValue: unknown) => {
            const field = fieldPath();
            if (field == null) {
                return;
            }
            registration = createRegistration(field, initValue);
            form.bridge.register(field, registration);
            registered = { field, registration, leaveGroup: group?.registerField(field) };
        };

        const unregister = () => {
            if (!registered) {
                return;
            }
            form.bridge.unRegister(registered.registration);
            registered.leaveGroup?.();
            registered = undefined;
        };

        const handleChange = (...args: unknown[]) => {
            form.bridge.changeFieldValue(registration, args[0], {
                onChange: (latestValues) => {
                    const [value, event, ...other] = args;
                    invoke(local[changeKey], value, event, ...other, latestValues);
                },
            });
        };

        const handleBlur = (...args: unknown[]) => {
            invoke(local.onBlur, ...args);
            form.bridge.blurField(registration);
        };

        const controlProps = mergeProps(
            {
                get disabled() {
                    return form.formProps.disabled;
                },
            },
            rest,
            {
                get id() {
                    return a11yId();
                },
                get name() {
                    return local.name;
                },
                get class() {
                    return local.pure && !group ? clsx(rest.class, `${prefix}-field-pure`, { [`${prefix}-field-${local.name}`]: Boolean(local.name) }, local.fieldClassName) : rest.class;
                },
                get prefix() {
                    return prefixContent();
                },
                get validateStatus() {
                    return view().shownStatus;
                },
                get insetLabel() {
                    return view().insetShown ? view().labelText : undefined;
                },
                get insetLabelId() {
                    return view().insetShown ? view().ids.label : undefined;
                },
                get 'aria-required'() {
                    return aria()['aria-required'];
                },
                get 'aria-labelledby'() {
                    return aria()['aria-labelledby'];
                },
                get 'aria-describedby'() {
                    return aria()['aria-describedby'];
                },
                get 'aria-invalid'() {
                    return aria()['aria-invalid'];
                },
                get 'aria-errormessage'() {
                    return aria()['aria-errormessage'];
                },
                get [valueKey]() {
                    return snapshot().value;
                },
                onBlur: handleBlur,
                [changeKey]: handleChange,
            }
        );

        const control = () => <Dynamic component={component} {...controlProps} />;

        const extraContent = () => (
            <Show when={hasContent(extraText())}>
                <div
                    id={view().ids.extraText}
                    class={clsx(`${prefix}-field-extra`, {
                        [`${prefix}-field-extra-string`]: typeof extraText() === 'string',
                        [`${prefix}-field-extra-middle`]: merged().extraTextPosition === 'middle',
                        [`${prefix}-field-extra-bottom`]: merged().extraTextPosition === 'bottom',
                    })}
                    x-semi-prop="extraText"
                >
                    {extraText()}
                </div>
            </Show>
        );

        // id, name and text come last: they must match what the control references
        const labelProps = mergeProps(
            {
                get required() {
                    return rulesRequired();
                },
                get align() {
                    return merged().labelAlign;
                },
                get width() {
                    return merged().labelWidth;
                },
            },
            () => view().labelConfig ?? {},
            {
                get id() {
                    return view().ids.label;
                },
                get name() {
                    return a11yId();
                },
                get text() {
                    return view().labelText;
                },
            }
        );

        createEffect(
            on(
                () => view().warnInsetFallback,
                (warn) => warning(warn, `[Semi Form]: ${name} has no inset label, so Field "${local.field}" is laid out with labelPosition 'top'`)
            )
        );

        useWatch(fieldPath, (field) => {
            unregister();
            register(readInitValue(field));
        });

        onMount(() => {
            register(mountedInitValue);
            if (registered && merged().trigger.includes('mount')) {
                void form.bridge.validateField(registration, store.getSnapshot().value);
            }
        });

        onCleanup(store.subscribe(() => setSnapshot(store.getSnapshot())));

        onCleanup(unregister);

        return (
            <Show when={!group && !local.pure} fallback={control()}>
                <div class={clsx(`${prefix}-field`, { [`${prefix}-field-${local.name}`]: Boolean(local.name) }, local.fieldClassName)} style={local.fieldStyle} x-extra-pos={merged().extraTextPosition} x-field-id={local.field} x-label-pos={labelPosition()}>
                    <FieldGrid
                        label={
                            <Show when={!local.noLabel && labelPosition() !== 'inset'}>
                                <Label {...labelProps} />
                            </Show>
                        }
                        labelAlign={merged().labelAlign}
                        labelCol={merged().labelCol}
                        labelPosition={labelPosition()}
                        mainClass={`${prefix}-field-main`}
                        row={view().wrapInRow}
                        wrapperCol={merged().wrapperCol}
                    >
                        <Show when={merged().extraTextPosition === 'middle'}>{extraContent()}</Show>
                        {control()}
                        <Show when={!local.noErrorMessage}>
                            <InternalErrorMessage error={snapshot().error} errorMessageId={view().ids.errorMessage} helpText={helpText()} helpTextId={view().ids.helpText} showValidateIcon={form.formProps.showValidateIcon} validateStatus={view().shownStatus} />
                        </Show>
                        <Show when={merged().extraTextPosition === 'bottom'}>{extraContent()}</Show>
                    </FieldGrid>
                </div>
            </Show>
        );
    }

    function SemiField(props: AnyProps) {
        const [, bare] = splitProps(props, [...FIELD_PROP_KEYS, ...valueKeys]);

        untrack(() => warning(props.field === undefined && shouldInject, "[Semi Form]: 'field' is required, please check your props of Field Component"));

        // A declared `field` always injects (a Checkbox or Radio used outside its Group); otherwise the options decide.
        // Not a field: only the Form-specific props are dropped, the control's own ones pass through.
        return (
            <Show when={props.field !== undefined || shouldInject} fallback={<Dynamic component={component} {...bare} />}>
                <InjectedField {...props} />
            </Show>
        );
    }

    return SemiField;
}

/**
 * Wraps a component as a form field: takes over its value and change handler and syncs them to the Form foundation,
 * and adds the Label and ErrorMessage. With labelPosition 'inset' the component receives `insetLabel` and
 * `insetLabelId` and must render the label with that id.
 */
export default function withField<K extends keyof JSX.IntrinsicElements>(component: K, opts?: WithFieldOption): (props: FieldProps<JSX.IntrinsicElements[K]>) => JSX.Element;
export default function withField<P extends object>(component: (props: P) => JSX.Element, opts?: WithFieldOption): (props: FieldProps<P>) => JSX.Element;
export default function withField(component: ValidComponent, opts: WithFieldOption = {}) {
    return createField(component, opts, true);
}

/** withField for the built-in components that render no inset label: labelPosition 'inset' falls back to 'top' */
export function withTopLabelField<P extends object>(component: (props: P) => JSX.Element, opts: WithFieldOption = {}) {
    return createField(component, opts, false) as (props: FieldProps<P>) => JSX.Element;
}
