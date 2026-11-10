<script lang="ts">
    import { type Component, type Snippet, onMount, untrack } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
    import FieldStore from '@fibrae/semi-foundation/components/form/field-store';
    import type { FieldRegistration } from '@fibrae/semi-foundation/components/form/interface';
    import { createFieldRegistration, getFieldAriaProps, isRequiredByRules, mergeFieldConfig, resolveFieldInitValue, resolveFieldView } from '@fibrae/semi-foundation/components/form/utils';
    import { joinIds, warning } from '@fibrae/semi-foundation/utils';
    import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
    import '@fibrae/semi-foundation/components/form/form.scss';
    import { useStoreSnapshot } from '../../hooks/index.js';
    import { type SlotKind, trackSlotKind } from '../../utils/index.js';
    import type { ColProps } from '../grid/interface.js';
    import { type FormContextValue, getArrayFieldContext, getFormContext, getFormInputGroupContext } from './context.js';
    import ErrorMessage from './error-message.svelte';
    import FieldGrid from './field-grid.svelte';
    import type { CommonFieldProps, FieldLabel, WithFieldOption } from './interface.js';
    import Label from './label.svelte';
    import { cloneDeep } from './utils.js';

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

    const form = getFormContext() as FormContextValue;
    const arrayField = getArrayFieldContext();
    const group = getFormInputGroupContext();

    // two Forms on a page may hold a field of the same name, so a field name cannot be the DOM id
    const uid = $props.id();
    let extraKind = $state<SlotKind>();
    let registered: { field: string; registration: FieldRegistration; leaveGroup?: () => void } | undefined;
    let controlInstance = $state.raw<Record<string, any>>();

    const Control = $derived(component as Component<Record<string, any>, object, string>);
    const valueKey = $derived(fieldOptions.valueKey ?? 'value');
    const changeKey = $derived(fieldOptions.onKeyChangeFnName ?? 'onChange');
    const blurKey = $derived(fieldOptions.onBlurFnName ?? 'onBlur');

    const merged = $derived({
        ...mergeFieldConfig({ labelPosition, labelWidth, labelAlign, labelCol, wrapperCol, extraTextPosition, stopValidateWithError, trigger, allowEmpty }, form.formProps),
        formHasCols: Boolean(form.formProps.labelCol && form.formProps.wrapperCol),
    } as ReturnType<typeof mergeFieldConfig> & { labelCol?: ColProps; wrapperCol?: ColProps; formHasCols: boolean });

    const a11yId = $derived(id || uid);
    const rulesRequired = $derived(isRequiredByRules(form.formProps, rules));
    const ownLayout = $derived(!group && !pure);

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

    // a prefix or a custom trigger takes the inset label's place, so resolveFieldView puts the label on top
    const view = $derived(
        resolveFieldView<FieldLabel>({
            id: a11yId,
            field,
            label,
            noLabel,
            validateStatus,
            status: snapshot().status,
            labelPosition: merged.labelPosition,
            labelCol: merged.labelCol,
            wrapperCol: merged.wrapperCol,
            formHasCols: merged.formHasCols,
            insetSupported: fieldOptions.insetLabel !== false,
            hasPrefix: Boolean(rest.prefix),
            hasTrigger: Boolean(triggerContent),
        })
    );

    // the foundation never sets 'validating', the one status a control does not accept
    const shownStatus = $derived(view.shownStatus as CommonFieldProps['validateStatus']);
    const shellLabel = $derived(ownLayout && !noLabel && view.labelPosition !== 'inset');

    const aria = $derived.by(() => {
        const { error, status } = snapshot();
        return {
            'aria-labelledby': ownAria['aria-labelledby'],
            'aria-describedby': ownAria['aria-describedby'],
            'aria-errormessage': ownAria['aria-errormessage'],
            ...getFieldAriaProps({
                own: ownAria,
                ids: view.ids,
                rulesRequired,
                label: view.labelConfig,
                labelPosition: view.labelPosition,
                noLabel,
                noErrorMessage,
                pure,
                inGroup: Boolean(group),
                hasHelpText: Boolean(helpText),
                hasExtraText: Boolean(extraText),
                error,
                status,
                shownStatus,
            }),
        };
    });

    const createRegistration = (path: string, value: unknown): FieldRegistration =>
        createFieldRegistration({ id: uid, field: path, store, initValue: value, valuePath: fieldOptions.valuePath ?? '', inArrayField: Boolean(arrayField) }, () => ({
            props: { keepState, allowEmpty, allowEmptyString, emptyValue, convert, rules, validator, transform, stopValidateWithError, trigger },
            formProps: form.formProps,
            arrayFieldKeepState: arrayField?.keepState,
        }));

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
        form.bridge.unRegister(registered.registration);
        registered.leaveGroup?.();
        registered = undefined;
    };

    const handleChange = (...args: unknown[]) => {
        form.bridge.changeFieldValue(registration, args[0], { onChange: (latestValues) => (rest[changeKey] as Handler | undefined)?.(...args, latestValues) });
    };

    // Cascader and TreeSelect report blur without a native event, so the event is not read
    const handleBlur = (...args: unknown[]) => {
        (rest[blurKey] as Handler | undefined)?.(...args);
        form.bridge.blurField(registration);
    };

    $effect(() => {
        const warn = view.warnInsetFallback;
        untrack(() => warning(warn, `[Semi Form]: the component has no inset label, so Field "${field}" is laid out with labelPosition 'top'`));
    });

    // A renamed field (a shifted ArrayField row) moves its registration; the first run is the mount below
    $effect(() => {
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

    // Svelte exports are static, so the wrapped control's own methods (focus, open ...) cannot be re-exported by name
    export function getControl() {
        return controlInstance;
    }
</script>

{#snippet insetText()}
    {#if fieldLabel}{@render fieldLabel()}{:else}{view.labelText}{/if}
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
        ...(view.insetShown && { insetLabel: insetText, insetLabelId: view.ids.label }),
        ...aria,
        [changeKey]: handleChange,
        ...(blurKey && { [blurKey]: handleBlur }),
    }}
    {#if valueKey === 'checked'}
        <Control {...injected} bind:checked={() => snapshot().value, () => {}} bind:this={controlInstance} />
    {:else if valueKey === 'fileList'}
        <Control {...injected} bind:fileList={() => snapshot().value, () => {}} bind:this={controlInstance} />
    {:else}
        <Control {...injected} bind:this={controlInstance} bind:value={() => snapshot().value, () => {}} />
    {/if}
{/snippet}

{#snippet labelView()}
    <!-- id, name and text come last: they must match what the control references -->
    <Label align={merged.labelAlign} required={rulesRequired} width={merged.labelWidth} {...view.labelConfig} children={fieldLabel} extra={labelExtra} id={view.ids.label} name={a11yId} text={view.labelText} />
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
        id={view.ids.extraText}
        x-semi-prop="extraText"
    >
        {@render extraText?.()}
    </div>
{/snippet}

{#if !ownLayout}
    {@render control()}
{:else}
    <div class={[`${cssClasses.PREFIX}-field`, { [`${cssClasses.PREFIX}-field-${name}`]: name }, fieldClassName]} style={fieldStyle} {...{ 'x-extra-pos': merged.extraTextPosition, 'x-field-id': field, 'x-label-pos': view.labelPosition }}>
        <FieldGrid label={shellLabel ? labelView : undefined} labelAlign={merged.labelAlign} labelCol={merged.labelCol} labelPosition={view.labelPosition} mainClass={`${cssClasses.PREFIX}-field-main`} row={view.wrapInRow} wrapperCol={merged.wrapperCol}>
            {#if extraText && merged.extraTextPosition === 'middle'}
                {@render extraView()}
            {/if}
            {@render control()}
            {#if !noErrorMessage}
                <ErrorMessage error={snapshot().error} {errorContent} errorMessageId={view.ids.errorMessage} {helpText} helpTextId={view.ids.helpText} showValidateIcon={form.formProps.showValidateIcon} validateStatus={shownStatus} />
            {/if}
            {#if extraText && merged.extraTextPosition === 'bottom'}
                {@render extraView()}
            {/if}
        </FieldGrid>
    </div>
{/if}
