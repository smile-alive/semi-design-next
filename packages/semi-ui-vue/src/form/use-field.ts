import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, onScopeDispose, shallowRef, useId, watch } from 'vue';
import FieldStore from '@fibrae/semi-foundation/form/field-store';
import type { FieldRegistration } from '@fibrae/semi-foundation/form/interface';
import { mergeFieldConfig, resolveFieldInitValue } from '@fibrae/semi-foundation/form/utils';
import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
import warning from '@fibrae/semi-foundation/utils/warning';
import { useArrayFieldContext, useFormContext, useFormInputGroupContext } from './context';
import type { CommonFieldProps } from './interface';
import { cloneDeep } from './utils';

export interface UseFieldOptions {
    valuePath: string;
    /** Reports a committed change: the wrapped component's emit arguments and the latest form values */
    onChange: (args: unknown[], latestValues: Record<string, any>) => void;
}

/**
 * A field's state and its registration with the Form. The field renders from its own store snapshot, its props and
 * the Form props, so an update of another field does not render it.
 */
export default function useField(props: Readonly<Partial<CommonFieldProps>>, options: UseFieldOptions) {
    const form = useFormContext();
    const arrayField = useArrayFieldContext();
    const group = useFormInputGroupContext();

    // two Forms on a page may hold a field of the same name, so a field name cannot be the DOM id
    const generatedId = useId();

    if (!form) {
        warning(true, '[Semi Form]: Field Component must be use inside the Form, please check your dom declaration');
        return undefined;
    }

    const { formState, formProps, bridge } = form;

    const merged = computed(() => {
        const formView = formProps.value;
        return {
            ...mergeFieldConfig(props, formView),
            formHasCols: Boolean(formView.labelCol && formView.wrapperCol),
            disabled: formView.disabled,
            showValidateIcon: formView.showValidateIcon,
        };
    });

    // keepState restores by path, and removing an ArrayField row shifts the paths of later rows (stale state)
    warning(Boolean(props.keepState && arrayField), `[Semi Form]: 'keepState' is not supported on Field "${props.field}" inside <ArrayField/>. It will be ignored. Use add/remove on the ArrayField to manage array items instead.`);

    let registered: { field: string; registration: FieldRegistration; leaveGroup?: () => void } | undefined;

    // onActivated also runs after the first mount; only a return from the cache sets up again
    let deactivated = false;

    const readInitValue = (field: string) => resolveFieldInitValue(props.initValue, ObjectUtil.get(arrayField?.value.values ?? formState.value.values ?? {}, field), arrayField?.value.shouldUseInitValue ?? true);

    // validateStatus only overrides the shown status, so it does not seed the field's own one
    const store = new FieldStore({ value: cloneDeep(readInitValue(props.field ?? '')) });
    const snapshot = shallowRef(store.getSnapshot());

    const createRegistration = (field: string): FieldRegistration => ({
        id: generatedId,
        field,
        store,
        initValue: readInitValue(field),
        valuePath: options.valuePath,
        get keepState() {
            return Boolean(props.keepState) && !arrayField;
        },
        get allowEmpty() {
            return merged.value.allowEmpty || Boolean(props.allowEmptyString);
        },
        getValidateOptions: () => ({
            rules: props.rules,
            validate: props.validator,
            transform: props.transform,
            stopValidateWithError: merged.value.stopValidateWithError,
        }),
        getChangeOptions: () => ({
            allowEmpty: merged.value.allowEmpty,
            allowEmptyString: props.allowEmptyString,
            emptyValue: props.emptyValue === undefined ? '' : props.emptyValue,
            convert: props.convert,
        }),
    });

    // a wrapped component may report a change from its onMounted, before the field registers
    let registration = createRegistration(props.field ?? '');

    const register = () => {
        if (props.field === undefined) return;
        registration = createRegistration(props.field);
        bridge.register(props.field, registration);
        registered = { field: props.field, registration, leaveGroup: group?.registerField(props.field) };
    };

    const unregister = () => {
        if (!registered) return;
        // renames happen one at a time, so another field may already own this name; leave its registration alone
        if (bridge.getField(registered.field) === registered.registration) {
            bridge.unRegister(registered.field);
        }
        registered.leaveGroup?.();
        registered = undefined;
    };

    const handleChange = (...args: unknown[]) => {
        bridge.changeFieldValue(registration, args[0], {
            allowEmpty: merged.value.allowEmpty,
            validate: merged.value.trigger.includes('change'),
            onChange: (latestValues) => options.onChange(args, latestValues),
        });
    };

    // Cascader and TreeSelect report blur without a native event, so the event is not read
    const handleBlur = () => {
        if (!store.getSnapshot().touched) {
            bridge.setFieldTouched(registration, true);
        }
        if (merged.value.trigger.includes('blur')) {
            void bridge.validateField(registration, store.getSnapshot().value);
        }
    };

    watch(
        () => props.field,
        () => {
            unregister();
            register();
        },
        { flush: 'post' }
    );

    onScopeDispose(
        store.subscribe(() => {
            snapshot.value = store.getSnapshot();
        })
    );

    onMounted(() => {
        register();
        if (registered && merged.value.trigger.includes('mount')) {
            void bridge.validateField(registration, store.getSnapshot().value);
        }
    });

    onBeforeUnmount(unregister);

    onDeactivated(() => {
        deactivated = true;
        unregister();
    });

    onActivated(() => {
        if (deactivated) {
            deactivated = false;
            register();
        }
    });

    return { generatedId, snapshot, merged, inGroup: Boolean(group), handleChange, handleBlur };
}
