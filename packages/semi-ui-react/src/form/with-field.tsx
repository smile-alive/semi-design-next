import type React from 'react';
import { isValidElement, memo, useEffect, useState, useInsertionEffect, useLayoutEffect, useEffectEvent, useId, useSyncExternalStore } from 'react';
import clsx from 'clsx';
import { cssClasses, FIELD_PROP_KEYS } from '@fibrae/semi-foundation/components/form/constants';
import FieldStore from '@fibrae/semi-foundation/components/form/field-store';
import { type FieldRegistrationView, createFieldRegistration, getFieldAriaProps, isRequiredByRules, mergeFieldConfig, resolveFieldInitValue } from '@fibrae/semi-foundation/components/form/utils';
import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
import shallowEqualObjects from '@fibrae/semi-foundation/utils/shallow-equal-objects';
import warning from '@fibrae/semi-foundation/utils/warning';
import { cloneDeep, hasContent } from '../_utils/index';
import { Col, Row } from '../grid';
import ErrorMessage, { hasErrorContent } from './error-message';
import { useFormState, useFieldBridge, useArrayFieldState } from './hooks';
import type { FieldProps } from './interface';
import Label, { type LabelProps } from './label';

function getDisplayName(WrappedComponent: React.ElementType) {
    if (typeof WrappedComponent === 'string') {
        return 'SemiField';
    }
    const originName = WrappedComponent.displayName || WrappedComponent.name;
    return originName ? `SemiField${originName}` : 'SemiField';
}

function shallowEqualArray(a: unknown[], b: unknown[]) {
    return a.length === b.length && a.every((item, i) => Object.is(item, b[i]));
}

interface MemoizedFieldProps {
    render: () => React.ReactNode;
    deps: unknown[];
    fieldProps: Record<string, unknown>;
}

/**
 * Skips rendering the wrapped component while the field state and every prop stay the same, as a Form update
 * re-renders all fields. `render` is ignored on a skip. Props are compared key by key because wrappers such as
 * Tooltip add and remove injected handlers via cloneElement.
 */
const MemoizedField = memo(
    function MemoizedField({ render }: MemoizedFieldProps) {
        return render();
    },
    (prev, next) => shallowEqualArray(prev.deps, next.deps) && shallowEqualObjects(prev.fieldProps, next.fieldProps)
);

const prefix = cssClasses.PREFIX;

export interface WithFieldOption {
    valueKey?: string;
    onKeyChangeFnName?: string;
    valuePath?: string;
    shouldMemo?: boolean;
    shouldInject?: boolean;
}

function mergeOptions(opts: WithFieldOption | undefined, props: { field?: unknown }) {
    const defaultOpts = {
        valueKey: 'value',
        onKeyChangeFnName: 'onChange',
        valuePath: '',
        shouldInject: true,
        shouldMemo: true,
    };
    const options = { ...defaultOpts, ...opts };

    // A declared `field` always injects (a Checkbox or Radio used outside its Group); otherwise options decide
    const shouldInject = props.field !== undefined ? true : options.shouldInject;

    return { options, shouldInject };
}

// Besides the shared field props: id and name, which the field sets on the control itself, and the props that would
// give the control a second source of truth, as its initial value comes in through initValue
const fieldOwnKeys = new Set<string>([...FIELD_PROP_KEYS, 'id', 'name', 'onChange', 'isInInputGroup', 'showValidateIcon', 'checked', 'defaultChecked', 'defaultValue']);

function controlProps(props: Record<string, any>) {
    return Object.fromEntries(Object.entries(props).filter(([key]) => !fieldOwnKeys.has(key)));
}

// A plain object rather than a ref: the registration built in render keeps `read`, satisfying the Compiler `refs` rule
class LatestView {
    #view: FieldRegistrationView;

    constructor(view: FieldRegistrationView) {
        this.#view = view;
    }

    read = () => this.#view;

    sync(view: FieldRegistrationView) {
        this.#view = view;
    }
}

function createField<C extends React.ElementType>(Component: C, opts: WithFieldOption | undefined, insetLabel: boolean): React.ComponentType<FieldProps<React.ComponentProps<C>>> {
    // the injected props are assembled dynamically, so they cannot be checked against the generic C
    const Control: React.ElementType = Component;

    function InjectedField(props: any) {
        const { field, label, noLabel, noErrorMessage, isInInputGroup, initValue, validateStatus, rules, name, fieldClassName, fieldStyle, helpText, extraText, pure, id } = props;
        const rest = controlProps(props);
        const { options } = mergeOptions(opts, props);

        // two Forms on a page may share a field name, so the name cannot be the DOM id
        const generatedId = useId();

        const formState = useFormState();

        const fieldBridge = useFieldBridge();
        const inForm = fieldBridge !== undefined;

        const formProps = inForm ? fieldBridge.getFormProps(['labelPosition', 'labelWidth', 'labelAlign', 'labelCol', 'wrapperCol', 'disabled', 'showValidateIcon', 'extraTextPosition', 'stopValidateWithError', 'trigger', 'allowEmpty', 'keepState', 'schema', 'validator']) : {};
        const required = inForm && isRequiredByRules(formProps, rules);
        const { labelPosition: labelPos, labelWidth: mergeLabelWidth, labelAlign: mergeLabelAlign, labelCol: mergeLabelCol, wrapperCol: mergeWrapperCol, extraTextPosition: mergeExtraPos, trigger: mergeTrigger } = mergeFieldConfig(props, formProps);
        // The control would be unnamed without an inset label, so the label goes on top: when the component cannot
        // render one, or when a prefix or a custom trigger takes its place
        const insetUnsupported = !insetLabel && labelPos === 'inset';
        const insetFallback = labelPos === 'inset' && (insetUnsupported || hasContent(rest.prefix) || typeof rest.triggerRender === 'function');
        const mergeLabelPos = insetFallback ? 'top' : labelPos;
        const warnInsetFallback = insetUnsupported && !noLabel;
        useEffect(() => {
            warning(warnInsetFallback, `[Semi Form]: ${getDisplayName(Component)} has no inset label, so Field "${field}" is laid out with labelPosition 'top'`);
        }, [warnInsetFallback, field]);

        const arrayFieldState = useArrayFieldState();
        // read from the rendered form state, not the Form instance, as a render may be discarded
        const formValues = arrayFieldState.values ?? formState.values;
        const initValueInFormOpts = inForm && typeof field !== 'undefined' ? ObjectUtil.get(formValues, field) : undefined;
        const inArrayField = Boolean(arrayFieldState.inArrayField);
        const initVal = resolveFieldInitValue(initValue, initValueInFormOpts, arrayFieldState.shouldUseInitValue);

        // copied once: the field's value must not share objects with the caller's initValue. validateStatus only
        // overrides the shown status, so it does not seed the field's own one.
        const [store] = useState(() => new FieldStore({ value: cloneDeep(initVal) }));
        const { value, touched, error, status } = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
        const validateOnMount = mergeTrigger.includes('mount');

        // The registration reads the props of the latest commit: the Form keeps the one registered, and the insertion
        // phase runs before the layout effects of the wrapped control, which may report a change with this render's props
        const view: FieldRegistrationView = { props, formProps, arrayFieldKeepState: arrayFieldState.keepState };
        const [latest] = useState(() => new LatestView(view));
        const registration = createFieldRegistration({ id: generatedId, field, store, initValue: initVal, valuePath: options.valuePath, inArrayField }, latest.read);

        const handleChange = (newValue: any, e: unknown, ...other: unknown[]) => {
            const fnKey = options.onKeyChangeFnName;
            fieldBridge.changeFieldValue(registration, newValue, {
                onChange: (latestValues) => {
                    if (fnKey in props && typeof props[fnKey] === 'function') {
                        props[fnKey](newValue, e, ...other, latestValues);
                    }
                },
            });
        };

        const handleBlur = (...e: any[]) => {
            props.onBlur?.(...e);
            fieldBridge.blurField(registration);
        };

        useInsertionEffect(() => {
            latest.sync(view);
        });

        const registerField = useEffectEvent(() => {
            // StrictMode registers again after the mount validation set the error;
            // the foundation reads the latest store
            fieldBridge.register(field, registration);
            return registration;
        });
        const unRegister = fieldBridge?.unRegister;
        useLayoutEffect(() => {
            if (!inForm || typeof field === 'undefined') {
                return undefined;
            }
            const registered = registerField();
            return () => unRegister(registered);
        }, [inForm, field, unRegister]);

        // after registration, so it does not write the result to the form state a second time
        const validateMounted = useEffectEvent(() => {
            if (inForm && validateOnMount) {
                void fieldBridge.validateField(registration, value);
            }
        });
        useLayoutEffect(() => {
            validateMounted();
        }, []);

        useEffect(() => {
            warning(!inForm, '[Semi Form]: Field Component must be use inside the Form, please check your dom declaration');
        }, [inForm]);
        if (!inForm) {
            return null;
        }

        const labelConfig: LabelProps | undefined = typeof label === 'object' && label !== null && !isValidElement(label) && !Array.isArray(label) ? label : undefined;
        const labelText = labelConfig ? (labelConfig.text ?? field) : label || field;
        const a11yId = id || generatedId;
        const labelId = labelConfig?.id || `${a11yId}-label`;
        const helpTextId = `${a11yId}-helpText`;
        const extraTextId = `${a11yId}-extraText`;
        const errorMessageId = `${a11yId}-errormessage`;

        const renderField = () => {
            const blockStatus = validateStatus || status;

            const extraCls = clsx(`${prefix}-field-extra`, {
                [`${prefix}-field-extra-string`]: typeof extraText === 'string',
                [`${prefix}-field-extra-middle`]: mergeExtraPos === 'middle',
                [`${prefix}-field-extra-bottom`]: mergeExtraPos === 'bottom',
            });

            const extraContent = extraText ? (
                <div id={extraTextId} className={extraCls} x-semi-prop="extraText">
                    {extraText}
                </div>
            ) : null;

            const newProps: Record<string, any> = {
                id: a11yId,
                ...rest,
                disabled: rest.disabled ?? formProps.disabled,
                onBlur: handleBlur,
                [options.onKeyChangeFnName]: handleChange,
                [options.valueKey]: value,
                validateStatus: blockStatus,
                ...getFieldAriaProps({
                    own: rest,
                    ids: { label: labelId, helpText: helpTextId, extraText: extraTextId, errorMessage: errorMessageId },
                    rulesRequired: required,
                    label: labelConfig,
                    labelPosition: mergeLabelPos,
                    noLabel,
                    noErrorMessage,
                    pure,
                    inGroup: isInInputGroup,
                    hasHelpText: Boolean(helpText),
                    hasExtraText: Boolean(extraText),
                    error,
                    errorHasContent: hasErrorContent(error),
                    status,
                    shownStatus: blockStatus,
                }),
            };
            if (options.onKeyChangeFnName !== 'onChange') {
                // the control reports its value through another handler, so its own onChange still reaches the caller
                newProps.onChange = props.onChange;
            }

            if (name) {
                newProps.name = name;
            }

            const fieldCls = clsx({
                [`${prefix}-field`]: true,
                [`${prefix}-field-${name}`]: Boolean(name),
                [fieldClassName]: Boolean(fieldClassName),
            });

            if (mergeLabelPos === 'inset' && !noLabel) {
                newProps.insetLabel = labelText;
                newProps.insetLabelId = labelId;
            }

            if (isInInputGroup) {
                return <Control {...newProps} />;
            }

            if (pure) {
                newProps.className = clsx(rest.className, {
                    [`${prefix}-field-pure`]: true,
                    [`${prefix}-field-${name}`]: Boolean(name),
                    [fieldClassName]: Boolean(fieldClassName),
                });
                return <Control {...newProps} />;
            }

            const withCol = mergeLabelCol && mergeWrapperCol;
            const labelColCls = mergeLabelAlign ? `${prefix}-col-${mergeLabelAlign}` : '';

            let labelContent = null;
            if (!noLabel && mergeLabelPos !== 'inset') {
                // id, name and text come last: they must match what the control references
                labelContent = <Label required={required} align={mergeLabelAlign} width={mergeLabelWidth} {...labelConfig} id={labelId} name={a11yId} text={labelText} />;
            }

            const fieldMainContent = (
                <div className={`${prefix}-field-main`}>
                    {mergeExtraPos === 'middle' && extraContent}
                    <Control {...newProps} />
                    {!noErrorMessage && <ErrorMessage error={error} errorMessageId={errorMessageId} helpText={helpText} helpTextId={helpTextId} showValidateIcon={formProps.showValidateIcon} validateStatus={blockStatus} />}
                    {mergeExtraPos === 'bottom' && extraContent}
                </div>
            );

            const labelColContent = (
                <Col {...mergeLabelCol} className={labelColCls}>
                    {labelContent}
                </Col>
            );
            const withColContent = (
                <>
                    {mergeLabelPos === 'top' ? <div style={{ overflow: 'hidden' }}>{labelColContent}</div> : labelColContent}
                    <Col {...mergeWrapperCol}>{fieldMainContent}</Col>
                </>
            );

            let content: React.ReactNode = (
                <>
                    {labelContent}
                    {fieldMainContent}
                </>
            );
            if (withCol) {
                // Form wraps in one Row only when it sets both cols itself
                content = formProps.labelCol && formProps.wrapperCol ? withColContent : <Row>{withColContent}</Row>;
            }

            return (
                <div className={fieldCls} style={fieldStyle} x-extra-pos={mergeExtraPos} x-field-id={field} x-label-pos={mergeLabelPos}>
                    {content}
                </div>
            );
        };

        if (!options.shouldMemo) {
            // a component with inner state must not be memoized, or it would miss its own state updates
            return renderField();
        }
        return <MemoizedField deps={[value, error, touched, status, field, mergeLabelPos, mergeLabelAlign, mergeLabelWidth, mergeLabelCol, mergeWrapperCol, mergeExtraPos, formProps.disabled, formProps.showValidateIcon]} fieldProps={props} render={renderField} />;
    }

    function SemiField(props: any) {
        const { options, shouldInject } = mergeOptions(opts, props);

        const missingField = typeof props.field === 'undefined' && options.shouldInject;
        useEffect(() => {
            warning(missingField, "[Semi Form]: 'field' is required, please check your props of Field Component");
        }, [missingField]);

        if (!shouldInject) {
            // not a field: only the Form-specific props are dropped, the control's own ones pass through
            return <Control {...controlProps(props)} id={props.id} name={props.name} onChange={props.onChange} />;
        }
        return <InjectedField {...props} />;
    }
    SemiField.displayName = getDisplayName(Component);
    return SemiField;
}

/**
 * With labelPosition 'inset' the component receives insetLabel and insetLabelId and must render the label with
 * that id.
 */
export default function withField<C extends React.ElementType>(Component: C, opts?: WithFieldOption): React.ComponentType<FieldProps<React.ComponentProps<C>>> {
    return createField(Component, opts, true);
}

/** withField for the built-in components that render no inset label: labelPosition 'inset' falls back to 'top' */
export function withTopLabelField<C extends React.ElementType>(Component: C, opts?: WithFieldOption): React.ComponentType<FieldProps<React.ComponentProps<C>>> {
    return createField(Component, opts, false);
}
