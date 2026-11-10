import type React from 'react';
import { useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import ArrayFieldRows from '@fibrae/semi-foundation/components/form/array-field-rows';
import { resolveKeepState } from '@fibrae/semi-foundation/components/form/utils';
import useDefaultProps from '../../base/use-default-props';
import { cloneDeep } from '../../utils/index';
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
    const [keysState, setKeys] = useState<string[] | null>(null);
    const [shouldUseInitValueState, setShouldUseInitValue] = useState<boolean | null>(null);

    const formState = useFormState();

    const formValues = parentArrayField.values ?? formState.values;

    const [rows] = useState(() => new ArrayFieldRows(fieldBridge, { field, initValue: props.initValue, formValues, formState }, { setKeys, setShouldUseInitValue, cloneDeep }));

    // until a setter is first called the rows still hold their initial values
    const keys = keysState ?? rows.keys;
    const shouldUseInitValue = shouldUseInitValueState ?? rows.shouldUseInitValue;
    const keepState = resolveKeepState(props.keepState, parentArrayField.keepState, fieldBridge.getFormProps(['keepState']).keepState);

    const arrayFields = keys.map((key, i) => ({
        key,
        field: `${field}[${i}]`,
        remove: () => rows.remove(i),
    }));

    // read the latest props without re-running the registration effect, which would wipe the rows on a keepState toggle
    const register = useEffectEvent(() => rows.register(field, props.initValue));

    const unRegister = useEffectEvent(() => rows.unmount(keepState));

    useLayoutEffect(() => {
        rows.mount();
    }, [rows]);

    useLayoutEffect(() => {
        register();
        return () => unRegister();
    }, [field]);

    // from the second commit on
    useLayoutEffect(() => {
        if (committed.current) {
            rows.sync();
        }
        committed.current = true;
    });

    return <ArrayFieldContext value={{ shouldUseInitValue, inArrayField: true, keepState, values: rows.rowValues(formState, formValues, parentArrayField.values) }}>{children({ arrayFields, add: rows.add, addWithInitValue: rows.addWithInitValue, move: rows.move })}</ArrayFieldContext>;
}
