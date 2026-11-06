import { type JSX, batch, createEffect, createMemo, createSignal, on, onCleanup, onMount, untrack } from 'solid-js';
import { generateKeys } from '@fibrae/semi-foundation/form/utils';
import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
import { createId } from '@fibrae/semi-foundation/utils/uuid';
import useDefaultProps from '../_base/use-default-props';
import useWatch from '../_base/use-watch';
import { type ArrayFieldContextValue, ArrayFieldContext, useArrayFieldContext, useFormContext } from './context';
import { cloneDeep } from './utils';

export interface ArrayFieldRow {
    key: string;
    /** The row's path, such as `users[1]`; it follows the row when rows before it are added or removed */
    readonly field: string;
    remove: () => void;
}

export interface ArrayFieldChildrenProps {
    /** One entry per row; an entry keeps its identity while its row exists */
    readonly arrayFields: ArrayFieldRow[];
    // a click event is accepted so `add` works as an onClick handler; non-number arguments are ignored
    add: (index?: number | MouseEvent) => void;
    addWithInitValue: (lineObject: Record<string, any> | string, index?: number) => void;
    /** Moves the row at `from` to `to`, with its key, value, errors and touched; indexes out of range are clamped */
    move: (from: number, to: number) => void;
}

export interface ArrayFieldProps {
    initValue?: any[];
    field: string;
    /**
     * Whether the rows' values, errors and touched stay in the form while the ArrayField is unmounted; a remounted
     * one shows the kept rows. Unset, it follows the Form; the rows' fields without their own follow it
     */
    keepState?: boolean;
    /** Called once; read `arrayFields` in the returned JSX to follow the rows */
    children: (props: ArrayFieldChildrenProps) => JSX.Element;
}

const defaultProps = {} satisfies Partial<ArrayFieldProps>;

export default function ArrayField(rawProps: ArrayFieldProps) {
    const props = useDefaultProps('ArrayField', rawProps, defaultProps);

    const form = useFormContext();
    const parent = useArrayFieldContext();

    if (!form) {
        throw new Error('ArrayField must be used inside Form');
    }

    let cachedUpdateKey: number | undefined | null = null;
    const rows = new Map<string, ArrayFieldRow>();

    const { bridge } = form;

    // read once: a changed field registers its own initial value in the effect below
    const mountedField = props.field;

    // an existing entry means setValues re-mounted this ArrayField, so its fields must not consume initValue
    const [shouldUseInitValue, setShouldUseInitValue] = createSignal(!bridge.getArrayField(mountedField));

    // Starts as the field the onMount below registers under, so a rename made before it ran (a parent's onMount)
    // moves that registration
    let registeredField = mountedField;

    const mountedFormState = form.formState();
    const field = createMemo(() => props.field);

    const formValues = () => parent?.values() ?? form.formState().values ?? {};

    // an entry left by an unmount with keepState: the rows show the values kept in the form, not initValue
    const initValue = bridge.getArrayField(mountedField) ? ObjectUtil.get(formValues(), mountedField) : (props.initValue ?? ObjectUtil.get(formValues(), mountedField));

    const [keys, setKeys] = createSignal(generateKeys(initValue));

    // separate copies: reset, add and remove must not modify the array the rows read
    const mountedInitValue = cloneDeep(initValue);
    const resetValue = cloneDeep(initValue);

    const arrayFields = createMemo(() => {
        const current = keys();
        for (const key of rows.keys()) {
            if (!current.includes(key)) {
                rows.delete(key);
            }
        }
        return current.map((key) => {
            let row = rows.get(key);
            if (!row) {
                row = {
                    key,
                    get field() {
                        return `${field()}[${keys().indexOf(key)}]`;
                    },
                    remove: () => remove(keys().indexOf(key)),
                };
                rows.set(key, row);
            }
            return row;
        });
    });

    const keepState = () => props.keepState ?? form.formProps.keepState ?? true;

    const context: ArrayFieldContextValue = {
        shouldUseInitValue,
        keepState,
        // rows read the initial value from here until the mount write renders
        values: () => (form.formState() === mountedFormState ? ObjectUtil.set(formValues(), mountedField, mountedInitValue) : parent?.values()),
    };

    // an outside update (formApi.setValue, setValues) renews updateKey
    const syncKeys = () => {
        const updateKey = bridge.getArrayField(field())?.updateKey;
        if (updateKey !== cachedUpdateKey) {
            cachedUpdateKey = updateKey;
            setKeys((current) => generateKeys(bridge.getValue(field()), current));
            setShouldUseInitValue(false);
        }
    };

    // Each row operation runs in one batch, so the rows and the form state change together and syncKeys sees the
    // updateKey the operation stored
    const add = (index?: number | MouseEvent) =>
        batch(() => {
            const current = keys();
            const safeIndex = typeof index === 'number' ? Math.max(0, Math.min(index, current.length)) : undefined;
            setShouldUseInitValue(true);
            setKeys(current.toSpliced(safeIndex ?? current.length, 0, createId()));
            cachedUpdateKey = bridge.addArrayFieldRow(field(), safeIndex);
        });

    const addWithInitValue = (row: Record<string, any> | string, index?: number) =>
        batch(() => {
            const added = bridge.addArrayFieldRowWithValue(field(), row, index);
            if (typeof index === 'number') {
                // a new key at the position: regenerating by position would keep the old keys, so fields keep stale values
                setKeys((current) => current.toSpliced(added.index, 0, createId()));
                cachedUpdateKey = added.updateKey;
                setShouldUseInitValue(false);
            }
        });

    const remove = (index: number) => {
        // a row entry kept after its row was removed has no position; toSpliced(-1) would remove the last row
        if (index < 0) {
            return;
        }
        batch(() => {
            bridge.removeArrayFieldRow(field(), index);
            setKeys((current) => current.toSpliced(index, 1));
        });
    };

    const move = (from: number, to: number) => {
        const current = keys();
        const last = current.length - 1;
        const source = Math.max(0, Math.min(from, last));
        const target = Math.max(0, Math.min(to, last));
        if (source === target) {
            return;
        }
        batch(() => {
            cachedUpdateKey = bridge.moveArrayFieldRow(field(), source, target);
            setKeys(current.toSpliced(source, 1).toSpliced(target, 0, current[source]));
        });
    };

    const childrenProps: ArrayFieldChildrenProps = {
        get arrayFields() {
            return arrayFields();
        },
        add,
        addWithInitValue,
        move,
    };

    // Built before the onMount below: the rows register in their own onMount first, and the mount write lays their
    // values over the initial array
    const view = <ArrayFieldContext.Provider value={context}>{untrack(() => props.children(childrenProps))}</ArrayFieldContext.Provider>;

    createEffect(on(form.formState, syncKeys, { defer: true }));

    onMount(() => {
        bridge.mountArrayField(mountedField, resetValue);
        // Disposed before the rows: a later computation of the same owner is cleaned first, so the array goes as a
        // whole and the rows' fields find their paths removed already
        onCleanup(() => bridge.unRegisterArrayField(field(), keepState()));
    });

    // a rename leaves the old path as an unmount does
    useWatch(field, (current) => {
        bridge.unRegisterArrayField(registeredField, keepState());
        registeredField = current;
        if (!bridge.getArrayField(current)) {
            // a changed field resets to its own initial value; its current value may hold rows the rename carried over
            bridge.registerArrayField(current, current === mountedField ? resetValue : cloneDeep(props.initValue ?? bridge.getInitValue(current)));
        }
        // registering does not update the form state, so the rows follow the new field here
        syncKeys();
    });

    return view;
}
