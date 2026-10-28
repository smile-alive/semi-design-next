import { type JSX, type ValidComponent, Show, children, createComputed, createEffect, createMemo, createSignal, createUniqueId, mergeProps, on, onCleanup, onMount, splitProps, untrack } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/form/constants';
import FieldStore from '@fibrae/semi-foundation/form/field-store';
import type { FieldRegistration } from '@fibrae/semi-foundation/form/interface';
import { getFieldAriaProps, isRequired, mergeFieldConfig, resolveFieldInitValue } from '@fibrae/semi-foundation/form/utils';
import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
import warning from '@fibrae/semi-foundation/utils/warning';
import hasContent from '../_base/has-content';
import { type FormContextValue, useArrayFieldContext, useFormContext, useFormInputGroupContext } from './context';
import ErrorMessage from './error-message';
import FieldGrid from './field-grid';
import type { CommonFieldProps, FieldProps } from './interface';
import Label from './label';
import { cloneDeep, hasErrorContent, invoke, isLabelConfig } from './utils';

const prefix = cssClasses.PREFIX;

export interface WithFieldOption {
    /** The wrapped component's value prop; `value` by default */
    valueKey?: string;
    /** The wrapped component's change handler; `onChange` by default */
    onKeyChangeFnName?: string;
    /** Where the value sits in the handler's first argument, such as `target.checked` for an event */
    valuePath?: string;
    /** false: without `field` the component renders bare, as a Checkbox or Radio inside its group */
    shouldInject?: boolean;
}

const fieldKeys = [
    'allowEmpty',
    'allowEmptyString',
    'convert',
    'emptyValue',
    'extraText',
    'extraTextPosition',
    'field',
    'fieldClassName',
    'fieldStyle',
    'helpText',
    'id',
    'initValue',
    'keepState',
    'label',
    'labelAlign',
    'labelCol',
    'labelPosition',
    'labelWidth',
    'name',
    'noErrorMessage',
    'noLabel',
    'pure',
    'rules',
    'stopValidateWithError',
    'transform',
    'trigger',
    'validateStatus',
    'validator',
    'wrapperCol',
] as const satisfies readonly (keyof CommonFieldProps)[];

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

        // rendered only inside a Form, see InjectedField
        const form = useFormContext() as FormContextValue;
        const arrayField = useArrayFieldContext();
        const group = useFormInputGroupContext();

        // two Forms on a page may share a field name, so the name cannot be the DOM id
        const generatedId = createUniqueId();

        untrack(() => warning(Boolean(local.keepState && arrayField), `[Semi Form]: 'keepState' is not supported on Field "${local.field}" inside <ArrayField/>. It will be ignored. Use add/remove on the ArrayField to manage array items instead.`));

        const merged = createMemo(() => mergeFieldConfig(local, form.formProps));
        const fieldPath = createMemo(() => local.field as string | undefined);
        const warnInsetFallback = createMemo(() => !insetLabel && merged().labelPosition === 'inset' && !local.noLabel);
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

        const createRegistration = (field: string, initValue: unknown): FieldRegistration => ({
            id: generatedId,
            field,
            store,
            initValue,
            valuePath,
            // removing a row shifts the paths of later rows, so restoring by path would surface stale state
            get keepState() {
                return Boolean(local.keepState) && !arrayField;
            },
            get allowEmpty() {
                return merged().allowEmpty || Boolean(local.allowEmptyString);
            },
            getValidateOptions: () => ({
                rules: local.rules,
                validate: local.validator,
                transform: local.transform,
                stopValidateWithError: merged().stopValidateWithError,
            }),
            getChangeOptions: () => ({
                allowEmpty: merged().allowEmpty,
                allowEmptyString: local.allowEmptyString,
                emptyValue: local.emptyValue === undefined ? '' : local.emptyValue,
                convert: local.convert,
            }),
        });

        // a wrapped component may report a change before the field registers
        let registration = untrack(() => createRegistration(local.field, mountedInitValue));
        let registered: { field: string; registration: FieldRegistration; leaveGroup?: () => void } | undefined;

        const a11yId = () => local.id || generatedId;
        const labelConfig = () => {
            const value = label();
            return isLabelConfig(value) ? value : undefined;
        };
        const labelText = (): JSX.Element => {
            const config = labelConfig();
            return config ? (config.text ?? local.field) : (label() as JSX.Element) || local.field;
        };
        const labelId = () => labelConfig()?.id || `${a11yId()}-label`;
        const helpTextId = () => `${a11yId()}-helpText`;
        const extraTextId = () => `${a11yId()}-extraText`;
        const errorMessageId = () => `${a11yId()}-errormessage`;
        // The control would be unnamed without an inset label, so the label goes on top: when the component cannot
        // render one, or when a prefix or a custom trigger takes its place
        const insetFallback = () => merged().labelPosition === 'inset' && (!insetLabel || hasContent(prefixContent()) || typeof rest.triggerRender === 'function');
        const labelPosition = () => (insetFallback() ? 'top' : merged().labelPosition);
        const insetShown = () => labelPosition() === 'inset' && !local.noLabel;
        const shownStatus = () => local.validateStatus || snapshot().status;

        // A layout creates only the texts it renders: nodes created for a text left out have no server markup to hydrate
        const ownLayout = () => !group && !local.pure;
        // an error replaces the help text, and so does a blank failed message
        const errorReplacesHelp = createMemo(() => {
            const { error } = snapshot();
            return Boolean(error) || (error === '' && shownStatus() === 'error');
        });
        const extraTextShown = () => merged().extraTextPosition === 'middle' || merged().extraTextPosition === 'bottom';
        const label = children(() => (!local.noLabel && (labelPosition() === 'inset' || ownLayout()) ? (local.label as JSX.Element) : undefined));
        const helpText = children(() => (ownLayout() && !local.noErrorMessage && !errorReplacesHelp() ? (local.helpText as JSX.Element) : undefined));
        const extraText = children(() => (ownLayout() && extraTextShown() ? (local.extraText as JSX.Element) : undefined));

        // Form.InputGroup adds its ids to the field's own references
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
                    ids: { label: labelId(), helpText: helpTextId(), extraText: extraTextId(), errorMessage: errorMessageId() },
                    rulesRequired: isRequired(local.rules),
                    label: labelConfig(),
                    labelPosition: labelPosition(),
                    noLabel: local.noLabel,
                    noErrorMessage: local.noErrorMessage,
                    pure: local.pure,
                    inGroup: Boolean(group),
                    hasHelpText: hasContent(helpText()),
                    hasExtraText: hasContent(extraText()),
                    error,
                    errorHasContent: hasErrorContent(error),
                    status,
                    shownStatus: shownStatus(),
                }),
            };
        });

        const register = (initValue: unknown) => {
            const field = fieldPath();
            if (field === undefined) {
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
            // renames happen one at a time, so another field may already own this name; leave its registration alone
            if (form.bridge.getField(registered.field) === registered.registration) {
                form.bridge.unRegister(registered.field);
            }
            registered.leaveGroup?.();
            registered = undefined;
        };

        const handleChange = (...args: unknown[]) => {
            form.bridge.changeFieldValue(registration, args[0], {
                allowEmpty: merged().allowEmpty,
                validate: merged().trigger.includes('change'),
                onChange: (latestValues) => {
                    const [value, event, ...other] = args;
                    invoke(local[changeKey], value, event, ...other, latestValues);
                },
            });
        };

        const handleBlur = (...args: unknown[]) => {
            invoke(local.onBlur, ...args);
            if (!store.getSnapshot().touched) {
                form.bridge.setFieldTouched(registration, true);
            }
            if (merged().trigger.includes('blur')) {
                void form.bridge.validateField(registration, store.getSnapshot().value);
            }
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
                    return shownStatus();
                },
                get insetLabel() {
                    return insetShown() ? labelText() : undefined;
                },
                get insetLabelId() {
                    return insetShown() ? labelId() : undefined;
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
                    id={extraTextId()}
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
                    return isRequired(local.rules);
                },
                get align() {
                    return merged().labelAlign;
                },
                get width() {
                    return merged().labelWidth;
                },
            },
            () => labelConfig() ?? {},
            {
                get id() {
                    return labelId();
                },
                get name() {
                    return a11yId();
                },
                get text() {
                    return labelText();
                },
            }
        );

        createEffect(on(warnInsetFallback, (warn) => warning(warn, `[Semi Form]: ${name} has no inset label, so Field "${local.field}" is laid out with labelPosition 'top'`)));

        // A computation, not an effect: a removed ArrayField row renames the rows after it, and the renames must land
        // before the Form's effects report the change, or onChange sees the shifted rows missing
        createComputed(
            on(
                fieldPath,
                (field) => {
                    unregister();
                    register(readInitValue(field));
                },
                { defer: true }
            )
        );

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
                        // the Form wraps the columns in one Row only when it sets both cols itself
                        row={!(form.formProps.labelCol && form.formProps.wrapperCol)}
                        wrapperCol={merged().wrapperCol}
                    >
                        <Show when={merged().extraTextPosition === 'middle'}>{extraContent()}</Show>
                        {control()}
                        <Show when={!local.noErrorMessage}>
                            <ErrorMessage error={snapshot().error} errorMessageId={errorMessageId()} helpText={helpText()} helpTextId={helpTextId()} showValidateIcon={form.formProps.showValidateIcon} validateStatus={shownStatus()} />
                        </Show>
                        <Show when={merged().extraTextPosition === 'bottom'}>{extraContent()}</Show>
                    </FieldGrid>
                </div>
            </Show>
        );
    }

    function SemiField(props: AnyProps) {
        const [, bare] = splitProps(props, [...fieldKeys.filter((key) => key !== 'id' && key !== 'name'), ...valueKeys]);

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
