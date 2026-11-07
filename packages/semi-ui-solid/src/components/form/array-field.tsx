import { type JSX, batch, createEffect, createMemo, createSignal, on, onCleanup, onMount, untrack } from 'solid-js';
import ArrayFieldRows from '@fibrae/semi-foundation/components/form/array-field-rows';
import { generateKeys, resolveKeepState } from '@fibrae/semi-foundation/components/form/utils';
import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
import useDefaultProps from '../../base/use-default-props';
import useWatch from '../../primitives/use-watch';
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

    const rowEntries = new Map<string, ArrayFieldRow>();

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
    const initialKeys = generateKeys(initValue);

    const [keys, setKeys] = createSignal(initialKeys);
    const rows = new ArrayFieldRows(bridge, initialKeys, { setKeys: (next) => setKeys(next), setShouldUseInitValue });

    // separate copies: reset, add and remove must not modify the array the rows read
    const mountedInitValue = cloneDeep(initValue);
    const resetValue = cloneDeep(initValue);

    const arrayFields = createMemo(() => {
        const current = keys();
        for (const key of rowEntries.keys()) {
            if (!current.includes(key)) {
                rowEntries.delete(key);
            }
        }
        return current.map((key) => {
            let row = rowEntries.get(key);
            if (!row) {
                row = {
                    key,
                    get field() {
                        return `${field()}[${keys().indexOf(key)}]`;
                    },
                    remove: () => remove(keys().indexOf(key)),
                };
                rowEntries.set(key, row);
            }
            return row;
        });
    });

    const keepState = () => resolveKeepState(props.keepState, parent?.keepState(), form.formProps.keepState);

    const context: ArrayFieldContextValue = {
        shouldUseInitValue,
        keepState,
        // rows read the initial value from here until the mount write renders
        values: () => (form.formState() === mountedFormState ? ObjectUtil.set(formValues(), mountedField, mountedInitValue) : parent?.values()),
    };

    const syncKeys = () => rows.sync(field());

    // Each row operation runs in one batch, so the rows and the form state change together and syncKeys sees the
    // updateKey the operation stored
    const add = (index?: number | MouseEvent) => batch(() => rows.add(field(), index));

    const addWithInitValue = (row: Record<string, any> | string, index?: number) => batch(() => rows.addWithInitValue(field(), row, index));

    const remove = (index: number) => {
        // a row entry kept after its row was removed has no position; toSpliced(-1) would remove the last row
        if (index >= 0) {
            batch(() => rows.remove(field(), index));
        }
    };

    const move = (from: number, to: number) => batch(() => rows.move(field(), from, to));

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
