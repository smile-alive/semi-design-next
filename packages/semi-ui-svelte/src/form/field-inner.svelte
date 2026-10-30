<script lang="ts">
    import { type Component, type Snippet, onMount, untrack } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/form/constants';
    import FieldStore from '@fibrae/semi-foundation/form/field-store';
    import type { FieldRegistration } from '@fibrae/semi-foundation/form/interface';
    import { getFieldAriaProps, isRequired, mergeFieldConfig, resolveFieldInitValue } from '@fibrae/semi-foundation/form/utils';
    import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
    import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
    import warning from '@fibrae/semi-foundation/utils/warning';
    import '@fibrae/semi-foundation/form/form.scss';
    import { type SlotKind, trackSlotKind } from '../_base/slot-kind.js';
    import useStoreSnapshot from '../_base/use-store-snapshot.svelte.js';
    import type { ColProps } from '../grid/interface.js';
    import { type FormContextValue, getArrayFieldContext, getFormContext, getFormInputGroupContext } from './context.js';
    import ErrorMessage from './error-message.svelte';
    import FieldGrid from './field-grid.svelte';
    import type { CommonFieldProps, WithFieldOption } from './interface.js';
    import Label from './label.svelte';
    import { cloneDeep, hasErrorContent, isLabelConfig } from './utils.js';

    type Handler = (...args: unknown[]) => void;
    type InnerProps = Omit<CommonFieldProps, 'field'> & { field?: string; component: Component<any, any, any>; fieldOptions?: WithFieldOption; triggerContent?: Snippet<any[]>; [key: string]: unknown };

    let {
        component,
        fieldOptions = {},
        field,
        label,
        labelPosition,
        labelAlign,
        labelWidth,
        labelCol,
        wrapperCol,
        noLabel,
        noErrorMessage,
        pure,
        keepState,
        allowEmptyString,
        allowEmpty,
        emptyValue,
        initValue,
        rules,
        validator,
        transform,
        convert,
        trigger,
        triggerContent,
        stopValidateWithError,
        extraTextPosition,
        validateStatus,
        name,
        id,
        fieldClassName,
        fieldStyle,
        fieldLabel,
        labelExtra,
        helpText,
        extraText,
        error: errorContent,
        ...rest
    }: InnerProps = $props();

    // rendered only inside a Form, see field.svelte
    const form = getFormContext() as FormContextValue;
    const arrayField = getArrayFieldContext();
    const group = getFormInputGroupContext();

    // two Forms on a page may hold a field of the same name, so a field name cannot be the DOM id
    const uid = $props.id();
    let extraKind = $state<SlotKind>();
    let registered: { field: string; registration: FieldRegistration; leaveGroup?: () => void } | undefined;

    const Control = $derived(component as Component<Record<string, any>, object, string>);
    const valueKey = $derived(fieldOptions.valueKey ?? 'value');
    const changeKey = $derived(fieldOptions.onKeyChangeFnName ?? 'onChange');
    const blurKey = $derived(fieldOptions.onBlurFnName ?? 'onBlur');

    const merged = $derived({
        ...mergeFieldConfig({ labelPosition, labelWidth, labelAlign, labelCol, wrapperCol, extraTextPosition, stopValidateWithError, trigger, allowEmpty }, form.formProps),
        formHasCols: Boolean(form.formProps.labelCol && form.formProps.wrapperCol),
    } as ReturnType<typeof mergeFieldConfig> & { labelCol?: ColProps; wrapperCol?: ColProps; formHasCols: boolean });

    const a11yId = $derived(id || uid);
    const labelId = $derived(`${a11yId}-label`);
    const helpTextId = $derived(`${a11yId}-helpText`);
    const extraTextId = $derived(`${a11yId}-extraText`);
    const errorMessageId = $derived(`${a11yId}-errormessage`);
    const labelConfig = $derived(isLabelConfig(label) ? label : undefined);
    const labelText = $derived((isLabelConfig(label) ? label.text : label) || field);
    const rulesRequired = $derived(isRequired(rules));
    const insetPosition = $derived(merged.labelPosition === 'inset');

    // a prefix or a custom trigger takes the inset label's place, so the label goes on top
    const insetFallback = $derived(insetPosition && (fieldOptions.insetLabel === false || Boolean(rest.prefix) || Boolean(triggerContent)));
    const insetShown = $derived(insetPosition && !insetFallback && !noLabel);
    const shownLabelPosition = $derived(insetFallback ? 'top' : merged.labelPosition);
    const ownLayout = $derived(!group && !pure);
    const shellLabel = $derived(ownLayout && !noLabel && shownLabelPosition !== 'inset');

    // FormInputGroup adds its ids to the field's own references
    const ownAria = $derived.by((): Record<string, unknown> => {
        if (!group) {
            return rest;
        }
        const groupAria = group.aria;
        return {
            'aria-required': rest['aria-required'],
            'aria-labelledby': joinIds(rest['aria-labelledby'] as string | undefined, groupAria.labelledby),
            'aria-describedby': joinIds(rest['aria-describedby'] as string | undefined, groupAria.describedby),
            'aria-errormessage': groupAria.errormessage,
        };
    });

    const readInitValue = (path?: string) => resolveFieldInitValue(initValue, path === undefined ? undefined : ObjectUtil.get(arrayField?.values ?? form.formState.values ?? {}, path), arrayField?.shouldUseInitValue ?? true);

    // read once, from the form state the field is created in: a row of a mounting ArrayField finds its value only
    // before the fields before it register
    const mountedInitValue = untrack(() => readInitValue(field));

    // copied once: the field's value must not share objects with the caller's initValue. validateStatus only overrides
    // the shown status, so it does not seed the field's own one.
    const store = new FieldStore({ value: cloneDeep(mountedInitValue) });

    const snapshot = useStoreSnapshot(store);

    // the foundation never sets 'validating', the one status a control does not accept
    const shownStatus = $derived((validateStatus || snapshot().status) as CommonFieldProps['validateStatus']);

    const aria = $derived.by(() => {
        const { error, status } = snapshot();
        return {
            'aria-labelledby': ownAria['aria-labelledby'],
            'aria-describedby': ownAria['aria-describedby'],
            'aria-errormessage': ownAria['aria-errormessage'],
            ...getFieldAriaProps({
                own: ownAria,
                ids: { label: labelId, helpText: helpTextId, extraText: extraTextId, errorMessage: errorMessageId },
                rulesRequired,
                label: labelConfig,
                labelPosition: shownLabelPosition,
                noLabel,
                noErrorMessage,
                pure,
                inGroup: Boolean(group),
                hasHelpText: Boolean(helpText),
                hasExtraText: Boolean(extraText),
                error,
                errorHasContent: hasErrorContent(error),
                status,
                shownStatus,
            }),
        };
    });

    const createRegistration = (path: string, value: unknown): FieldRegistration => ({
        id: uid,
        field: path,
        store,
        initValue: value,
        valuePath: fieldOptions.valuePath ?? '',
        // removing a row shifts the paths of later rows, so restoring by path would surface stale state
        get keepState() {
            return Boolean(keepState) && !arrayField;
        },
        get allowEmpty() {
            return merged.allowEmpty || Boolean(allowEmptyString);
        },
        getValidateOptions: () => ({
            rules,
            validate: validator,
            transform,
            stopValidateWithError: merged.stopValidateWithError,
        }),
        getChangeOptions: () => ({
            allowEmpty: merged.allowEmpty,
            allowEmptyString,
            emptyValue: emptyValue === undefined ? '' : emptyValue,
            convert,
        }),
    });

    // a wrapped component may report a change before the field registers
    let registration = untrack(() => createRegistration(field ?? '', mountedInitValue));

    const register = (value: unknown) => {
        if (field === undefined) {
            return;
        }
        registration = createRegistration(field, value);
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
            allowEmpty: merged.allowEmpty,
            validate: merged.trigger.includes('change'),
            onChange: (latestValues) => (rest[changeKey] as Handler | undefined)?.(...args, latestValues),
        });
    };

    // Cascader and TreeSelect report blur without a native event, so the event is not read
    const handleBlur = (...args: unknown[]) => {
        (rest[blurKey] as Handler | undefined)?.(...args);
        if (!store.getSnapshot().touched) {
            form.bridge.setFieldTouched(registration, true);
        }
        if (merged.trigger.includes('blur')) {
            void form.bridge.validateField(registration, store.getSnapshot().value);
        }
    };

    $effect(() => {
        const warn = insetPosition && !noLabel && fieldOptions.insetLabel === false;
        untrack(() => warning(warn, `[Semi Form]: the component has no inset label, so Field "${field}" is laid out with labelPosition 'top'`));
    });

    $effect(() => {
        const warn = Boolean(keepState && arrayField);
        untrack(() => warning(warn, `[Semi Form]: 'keepState' is not supported on Field "${field}" inside <ArrayField/>. It will be ignored. Use add/remove on the ArrayField to manage array items instead.`));
    });

    // A renamed field (a shifted ArrayField row) moves its registration; the first run is the mount below
    $effect.pre(() => {
        const path = field;
        untrack(() => {
            if (registered && registered.field !== path) {
                unregister();
                register(readInitValue(path));
            }
        });
    });

    onMount(() => {
        register(mountedInitValue);
        if (registered && merged.trigger.includes('mount')) {
            void form.bridge.validateField(registration, store.getSnapshot().value);
        }
        return unregister;
    });
</script>

{#snippet insetText()}
    {#if fieldLabel}{@render fieldLabel()}{:else}{labelText}{/if}
{/snippet}

{#snippet control()}
    {@const injected = {
        id: a11yId,
        ...rest,
        disabled: rest.disabled ?? form.formProps.disabled,
        ...(pure && { class: [rest.class, `${cssClasses.PREFIX}-field-pure`, { [`${cssClasses.PREFIX}-field-${name}`]: name }, fieldClassName] }),
        ...(name && { name }),
        ...(triggerContent && { trigger: triggerContent }),
        ...(fieldOptions.validateStatus !== false && { validateStatus: shownStatus }),
        ...(insetShown && { insetLabel: insetText, insetLabelId: labelId }),
        ...aria,
        [changeKey]: handleChange,
        ...(blurKey && { [blurKey]: handleBlur }),
    }}
    {#if valueKey === 'checked'}
        <Control {...injected} bind:checked={() => snapshot().value, () => {}} />
    {:else if valueKey === 'fileList'}
        <Control {...injected} bind:fileList={() => snapshot().value, () => {}} />
    {:else}
        <Control {...injected} bind:value={() => snapshot().value, () => {}} />
    {/if}
{/snippet}

{#snippet labelView()}
    <!-- id, name and text come last: they must match what the control references -->
    <Label align={merged.labelAlign} required={rulesRequired} width={merged.labelWidth} {...labelConfig} children={fieldLabel} extra={labelExtra} id={labelId} name={a11yId} text={labelText} />
{/snippet}

{#snippet extraView()}
    <div
        {@attach trackSlotKind((kind) => (extraKind = kind))}
        class={[
            `${cssClasses.PREFIX}-field-extra`,
            {
                [`${cssClasses.PREFIX}-field-extra-string`]: extraKind === 'text',
                [`${cssClasses.PREFIX}-field-extra-middle`]: merged.extraTextPosition === 'middle',
                [`${cssClasses.PREFIX}-field-extra-bottom`]: merged.extraTextPosition === 'bottom',
            },
        ]}
        id={extraTextId}
        x-semi-prop="extraText"
    >
        {@render extraText?.()}
    </div>
{/snippet}

{#if !ownLayout}
    {@render control()}
{:else}
    <div class={[`${cssClasses.PREFIX}-field`, { [`${cssClasses.PREFIX}-field-${name}`]: name }, fieldClassName]} style={fieldStyle} {...{ 'x-extra-pos': merged.extraTextPosition, 'x-field-id': field, 'x-label-pos': shownLabelPosition }}>
        <FieldGrid label={shellLabel ? labelView : undefined} labelAlign={merged.labelAlign} labelCol={merged.labelCol} labelPosition={shownLabelPosition} mainClass={`${cssClasses.PREFIX}-field-main`} row={Boolean(merged.labelCol && merged.wrapperCol) && !merged.formHasCols} wrapperCol={merged.wrapperCol}>
            {#if extraText && merged.extraTextPosition === 'middle'}
                {@render extraView()}
            {/if}
            {@render control()}
            {#if !noErrorMessage}
                <ErrorMessage error={snapshot().error} {errorContent} {errorMessageId} {helpText} {helpTextId} showValidateIcon={form.formProps.showValidateIcon} validateStatus={shownStatus} />
            {/if}
            {#if extraText && merged.extraTextPosition === 'bottom'}
                {@render extraView()}
            {/if}
        </FieldGrid>
    </div>
{/if}
