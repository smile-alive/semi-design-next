import type React from 'react';
import { useEffectEvent, useLayoutEffect, useState } from 'react';
import type { ArrayFieldRegistration } from '@fibrae/semi-foundation/form/interface';
import { generateKeys } from '@fibrae/semi-foundation/form/utils';
import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import useDefaultProps from '../_base/use-default-props';
import { cloneDeep } from '../_utils/index';
import { ArrayFieldContext, useArrayFieldContext, useFieldBridgeContext } from './context';
import { useFormState, useStateWithGetter } from './hooks';

export interface ArrayFieldProps {
    initValue?: any[];
    field: string;
    /** Keeps the rows in the form state after unmount; unset follows the Form. Also the default of the row fields */
    keepState?: boolean;
    children: (props: ArrayFieldChildrenProps) => React.ReactNode;
}

export interface ArrayFieldChildrenProps {
    arrayFields: {
        key: string;
        field: string;
        remove: () => void;
    }[];
    // a click event is accepted so `add` works as an onClick handler; non-number arguments are ignored
    add: (index?: number | React.MouseEvent) => void;
    addWithInitValue: (lineObject: Record<string, any>, index?: number) => void;
    /** Moves the row at `from` to `to`, both clamped to the rows; the row keeps its key */
    move: (from: number, to: number) => void;
}

function filterArrayByIndex(array: any[], index: number) {
    return array.filter((_item, i) => i !== index);
}

function getUpdateKey(arrayField: ArrayFieldRegistration): number | undefined {
    return arrayField?.updateKey || undefined;
}

// a class, not a ref: add() reaches render through the children function
class ArrayFieldRuntime {
    #cacheUpdateKey: number | null | undefined = null;
    #committed = false;

    changeUpdateKey(updateKey?: number) {
        const changed = updateKey !== this.#cacheUpdateKey;
        this.#cacheUpdateKey = updateKey;
        return changed;
    }

    /** True from the second commit on */
    commit() {
        const updated = this.#committed;
        this.#committed = true;
        return updated;
    }
}

const defaultProps = {} satisfies Partial<ArrayFieldProps>;

export default function ArrayField(rawProps: ArrayFieldProps) {
    const props = useDefaultProps('ArrayField', rawProps, defaultProps);
    const { children, field } = props;

    const fieldBridge = useFieldBridgeContext();

    if (!fieldBridge) {
        throw new Error('ArrayField must be used inside Form');
    }

    const parentArrayField = useArrayFieldContext();

    const [runtime] = useState(() => new ArrayFieldRuntime());

    const formState = useFormState();

    const formValues = parentArrayField.values ?? formState.values;

    const [mounted] = useState(() => {
        // an existing entry: the ArrayField remounts after a keepState unmount or a setValues, so the rows read the form state
        const registered = Boolean(fieldBridge.getArrayField(field));
        const initValue = registered ? ObjectUtil.get(formValues, field) : props.initValue || ObjectUtil.get(formValues, field);
        return {
            field,
            formState,
            // separate copies: reset and add/remove must not modify the array the rows read
            initValue: cloneDeep(initValue),
            resetValue: cloneDeep(initValue),
            keys: generateKeys(initValue),
            shouldUseInitValue: !registered,
        };
    });

    const [shouldUseInitValue, setShouldUseInitValue] = useState(mounted.shouldUseInitValue);

    const [keys, setKeys, getKeys] = useStateWithGetter(mounted.keys);

    const { resetValue } = mounted;
    const keepState: boolean = props.keepState ?? parentArrayField.keepState ?? fieldBridge.getFormProps(['keepState']).keepState ?? true;

    // rows read the initial value from here until the mount write renders; a render may be discarded, so no write
    const rowValues = formState === mounted.formState ? ObjectUtil.set(formValues, field, mounted.initValue) : parentArrayField.values;

    const arrayFields = keys.map((key, i) => ({
        key,
        field: `${field}[${i}]`,
        remove: () => remove(i),
    }));

    const mountValue = useEffectEvent(() => fieldBridge.mountArrayField(field, resetValue));

    // StrictMode's extra cleanup, a changed field, or another ArrayField of this field unmounting in the same commit
    // removes the registration, so register again. A changed field resets to its own initial value, not the mounted
    // field's; its current value may already hold rows the rename carried over.
    const register = useEffectEvent(() => {
        if (!fieldBridge.getArrayField(field)) {
            fieldBridge.registerArrayField(field, field === mounted.field ? resetValue : cloneDeep(props.initValue || fieldBridge.getInitValue(field)));
        }
    });

    // reads the latest keepState without re-running the registration effect, which would wipe the rows on a toggle
    const unRegister = useEffectEvent((registeredField: string) => fieldBridge.unRegisterArrayField(registeredField, keepState));

    const syncKeys = useEffectEvent(() => {
        const updateKey = getUpdateKey(fieldBridge.getArrayField(field));
        if (runtime.changeUpdateKey(updateKey)) {
            setKeys(generateKeys(fieldBridge.getValue(field), getKeys()));
            setShouldUseInitValue(false);
        }
    });

    const add = (index?: number | React.MouseEvent) => {
        const newKeys = getKeys().slice();
        const newKey = createId();
        const safeIndex = typeof index === 'number' ? Math.max(0, Math.min(index, newKeys.length)) : undefined;
        newKeys.splice(safeIndex ?? newKeys.length, 0, newKey);

        setShouldUseInitValue(true);
        setKeys(newKeys);
        runtime.changeUpdateKey(fieldBridge.addArrayFieldRow(field, safeIndex));
        return newKey;
    };

    const addWithInitValue = (rowVal: Record<string, any> | string, index?: number) => {
        const row = fieldBridge.addArrayFieldRowWithValue(field, rowVal, index);
        if (typeof index === 'number') {
            // a new key at the position: regenerating by position would keep the old keys, so fields keep stale values
            setKeys(getKeys().toSpliced(row.index, 0, createId()));
            runtime.changeUpdateKey(row.updateKey);
            // the new row's fields take the given row value, as after syncKeys
            setShouldUseInitValue(false);
        }
    };

    const remove = (i: number) => {
        fieldBridge.removeArrayFieldRow(field, i);
        setKeys(filterArrayByIndex(getKeys(), i));
    };

    const move = (from: number, to: number) => {
        const currentKeys = getKeys();
        const clamp = (index: number) => Math.max(0, Math.min(index, currentKeys.length - 1));
        const [source, target] = [clamp(from), clamp(to)];
        if (source === target) {
            return;
        }
        setKeys(currentKeys.toSpliced(source, 1).toSpliced(target, 0, currentKeys[source]));
        runtime.changeUpdateKey(fieldBridge.moveArrayFieldRow(field, source, target));
    };

    useLayoutEffect(() => {
        mountValue();
    }, []);

    useLayoutEffect(() => {
        register();
        return () => unRegister(field);
    }, [field]);

    useLayoutEffect(() => {
        if (runtime.commit()) {
            syncKeys();
        }
    });

    return <ArrayFieldContext value={{ shouldUseInitValue, inArrayField: true, keepState, values: rowValues }}>{children({ arrayFields, add, addWithInitValue, move })}</ArrayFieldContext>;
}
