import type React from 'react';
import { useEffectEvent, useLayoutEffect, useState } from 'react';
import type { ArrayFieldRegistration } from '@fibrae/semi-foundation/form/interface';
import { generateKeys } from '@fibrae/semi-foundation/form/utils';
import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import useDefaultProps from '../_base/use-default-props';
import { cloneDeep } from '../_utils/index';
import { ArrayFieldContext, useArrayFieldContext, useFieldBridgeContext } from './context';
import { useFormState, useStateWithGetter } from './hooks/index';

export interface ArrayFieldProps {
    initValue?: any[];
    field: string;
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
}

function filterArrayByIndex(array: any[], index: number) {
    return array.filter((_item, i) => i !== index);
}

function getUpdateKey(arrayField: ArrayFieldRegistration): number | undefined {
    if (!arrayField) {
        return undefined;
    }
    if (arrayField && arrayField.updateKey) {
        return arrayField.updateKey;
    }
    return undefined;
}

// a class, not a ref: add() reaches render through the children function
class ArrayFieldRuntime {
    #cacheUpdateKey: number | null | undefined = null;
    #committed = false;

    /** Remembers `updateKey`; true when it differs from the remembered one */
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
        const initValue = props.initValue || ObjectUtil.get(formValues, field);
        return {
            field,
            formState,
            // separate copies: reset and add/remove must not modify the array the rows read
            initValue: cloneDeep(initValue),
            resetValue: cloneDeep(initValue),
            keys: generateKeys(initValue),
            // an existing entry means setValues re-mounted this ArrayField, so its fields must not consume initValue
            shouldUseInitValue: !fieldBridge.getArrayField(field),
        };
    });

    const [shouldUseInitValue, setShouldUseInitValue] = useState(mounted.shouldUseInitValue);

    const [keys, setKeys, getKeys] = useStateWithGetter(mounted.keys);

    const { unRegisterArrayField } = fieldBridge;
    const { resetValue } = mounted;

    // rows read the initial value from here until the mount write renders; a render may be discarded, so no write
    const rowValues = formState === mounted.formState ? ObjectUtil.set(formValues, field, mounted.initValue) : parentArrayField.values;

    const mountValue = useEffectEvent(() => fieldBridge.mountArrayField(field, resetValue));

    // StrictMode's extra cleanup, a changed field, or another ArrayField of this field unmounting in the same commit
    // removes the registration, so register again. A changed field resets to its own initial value, not the mounted
    // field's; its current value may already hold rows the rename carried over.
    const register = useEffectEvent(() => {
        if (!fieldBridge.getArrayField(field)) {
            fieldBridge.registerArrayField(field, field === mounted.field ? resetValue : cloneDeep(props.initValue || fieldBridge.getInitValue(field)));
        }
    });

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

    const arrayFields = keys.map((key, i) => ({
        key,
        field: `${field}[${i}]`,
        remove: () => remove(i),
    }));

    useLayoutEffect(() => {
        mountValue();
    }, []);

    useLayoutEffect(() => {
        register();
        return () => unRegisterArrayField(field);
    }, [field, unRegisterArrayField]);

    useLayoutEffect(() => {
        if (runtime.commit()) {
            syncKeys();
        }
    });

    return <ArrayFieldContext value={{ shouldUseInitValue, inArrayField: true, values: rowValues }}>{children({ arrayFields, add, addWithInitValue })}</ArrayFieldContext>;
}
