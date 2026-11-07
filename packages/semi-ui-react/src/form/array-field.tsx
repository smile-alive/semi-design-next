import type React from 'react';
import { useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import ArrayFieldRows from '@fibrae/semi-foundation/components/form/array-field-rows';
import { generateKeys, resolveKeepState } from '@fibrae/semi-foundation/components/form/utils';
import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
import useDefaultProps from '../_base/use-default-props';
import { cloneDeep } from '../_utils/index';
import { ArrayFieldContext, useArrayFieldContext, useFieldBridgeContext } from './context';
import { useFormState } from './hooks';

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

const defaultProps = {} satisfies Partial<ArrayFieldProps>;

export default function ArrayField(rawProps: ArrayFieldProps) {
    const props = useDefaultProps('ArrayField', rawProps, defaultProps);
    const { children, field } = props;

    const fieldBridge = useFieldBridgeContext();

    if (!fieldBridge) {
        throw new Error('ArrayField must be used inside Form');
    }

    const parentArrayField = useArrayFieldContext();

    const committed = useRef(false);

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
    const [keys, setKeys] = useState(mounted.keys);

    // a class, not a ref: add() reaches render through the children function
    const [rows] = useState(() => new ArrayFieldRows(fieldBridge, mounted.keys, { setKeys, setShouldUseInitValue }));

    const { resetValue } = mounted;
    const keepState = resolveKeepState(props.keepState, parentArrayField.keepState, fieldBridge.getFormProps(['keepState']).keepState);

    // rows read the initial value from here until the mount write renders; a render may be discarded, so no write
    const rowValues = formState === mounted.formState ? ObjectUtil.set(formValues, field, mounted.initValue) : parentArrayField.values;

    const arrayFields = keys.map((key, i) => ({
        key,
        field: `${field}[${i}]`,
        remove: () => rows.remove(field, i),
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

    const syncKeys = useEffectEvent(() => rows.sync(field));

    const add = (index?: number | React.MouseEvent) => rows.add(field, index);

    const addWithInitValue = (rowVal: Record<string, any> | string, index?: number) => rows.addWithInitValue(field, rowVal, index);

    const move = (from: number, to: number) => rows.move(field, from, to);

    useLayoutEffect(() => {
        mountValue();
    }, []);

    useLayoutEffect(() => {
        register();
        return () => unRegister(field);
    }, [field]);

    // from the second commit on
    useLayoutEffect(() => {
        if (committed.current) {
            syncKeys();
        }
        committed.current = true;
    });

    return <ArrayFieldContext value={{ shouldUseInitValue, inArrayField: true, keepState, values: rowValues }}>{children({ arrayFields, add, addWithInitValue, move })}</ArrayFieldContext>;
}
