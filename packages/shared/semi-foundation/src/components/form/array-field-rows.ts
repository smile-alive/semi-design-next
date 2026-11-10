import { clamp } from 'es-toolkit';
import { createId } from '../../utils/index';
import * as ObjectUtil from '../../utils/object';
import type { FieldBridge } from './interface';
import { generateKeys } from './utils';

export interface ArrayFieldRowsHost {
    /** Renders the rows with these keys */
    setKeys: (keys: string[]) => void;
    /** Whether the row fields mounting next take their own initValue (rows just added) or the form value */
    setShouldUseInitValue: (value: boolean) => void;
    /** Each framework keeps its own nodes (VNode, Node, React element) out of the copy */
    cloneDeep: <T>(value: T) => T;
}

export interface ArrayFieldRowsMount {
    field: string;
    /** The `initValue` prop; read once, a renamed field takes the one `rename` is given */
    initValue?: unknown;
    /** The form values the rows read: the parent ArrayField's, else the Form's */
    formValues: any;
    /** The Form's state at mount; `rowValues` serves the initial value until the state is another one */
    formState: unknown;
}

/**
 * One ArrayField: its registration under the current field, and its row keys. Each row operation edits the form state
 * through the bridge and hands the host the next keys. A key stays with its row, so the row's fields keep their state
 * while rows before it are added, removed or moved.
 */
export default class ArrayFieldRows {
    #bridge: FieldBridge;
    #host: ArrayFieldRowsHost;
    #field: string;
    #mountedField: string;
    #mountedFormState: unknown;
    // separate copies: reset, add and remove must not modify the array the rows read
    #mountedInitValue: unknown;
    #resetValue: unknown;
    #keys: string[];
    #shouldUseInitValue: boolean;
    // The updateKey the keys follow: a different one is an outside update (formApi.setValue, setValues, reset)
    #updateKey: number | undefined | null = null;

    constructor(bridge: FieldBridge, { field, initValue, formValues, formState }: ArrayFieldRowsMount, host: ArrayFieldRowsHost) {
        this.#bridge = bridge;
        this.#host = host;
        this.#field = field;
        this.#mountedField = field;
        this.#mountedFormState = formState;
        // an existing entry: the ArrayField remounts after a keepState unmount or a setValues, so the rows read the form state
        const registered = Boolean(bridge.getArrayField(field));
        const mountedValue = registered ? ObjectUtil.get(formValues, field) : initValue || ObjectUtil.get(formValues, field);
        this.#mountedInitValue = host.cloneDeep(mountedValue);
        this.#resetValue = host.cloneDeep(mountedValue);
        this.#keys = generateKeys(mountedValue);
        this.#shouldUseInitValue = !registered;
    }

    #setKeys(keys: string[]) {
        this.#keys = keys;
        this.#host.setKeys(keys);
    }

    #setShouldUseInitValue(value: boolean) {
        this.#shouldUseInitValue = value;
        this.#host.setShouldUseInitValue(value);
    }

    /** The keys the host starts from; it follows `setKeys` afterwards */
    get keys() {
        return this.#keys;
    }

    /** Whether the host starts with row fields taking their own initValue; it follows `setShouldUseInitValue` afterwards */
    get shouldUseInitValue() {
        return this.#shouldUseInitValue;
    }

    /** Rows read the initial value from here until the mount write renders; a render may be discarded, so no write */
    rowValues(formState: unknown, formValues: any, parentValues: any) {
        return formState === this.#mountedFormState ? ObjectUtil.set(formValues, this.#field, this.#mountedInitValue) : parentValues;
    }

    mount() {
        this.#bridge.mountArrayField(this.#mountedField, this.#resetValue);
    }

    /**
     * Takes `field` as the registered path, registering it unless an entry exists: the entry may be gone after
     * StrictMode's extra cleanup, a rename, or another ArrayField of this field unmounting in the same commit. A field
     * other than the mounted one resets to its own initial value; its current value may already hold rows a rename
     * carried over.
     */
    register(field: string, initValue?: unknown) {
        this.#field = field;
        if (!this.#bridge.getArrayField(field)) {
            this.#bridge.registerArrayField(field, field === this.#mountedField ? this.#resetValue : this.#host.cloneDeep(initValue || this.#bridge.getInitValue(field)));
        }
    }

    rename(field: string, keepState: boolean, initValue?: unknown) {
        this.unmount(keepState);
        this.register(field, initValue);
        // registering does not update the form state, so the rows follow the new field here
        this.sync();
    }

    /** Unregisters the path registered last, not the field the host shows now */
    unmount(keepState: boolean) {
        this.#bridge.unRegisterArrayField(this.#field, keepState);
    }

    /** Rebuilds the keys from the form value after an outside update; a no-op while the updateKey stays */
    sync = () => {
        const updateKey = this.#bridge.getArrayField(this.#field)?.updateKey;
        if (updateKey === this.#updateKey) {
            return;
        }
        this.#updateKey = updateKey;
        this.#setKeys(generateKeys(this.#bridge.getValue(this.#field), this.#keys));
        this.#setShouldUseInitValue(false);
    };

    /** Inserts an empty row before `index`, clamped to the rows; without a number (a click event) appends one */
    add = (index?: unknown) => {
        const safeIndex = typeof index === 'number' ? clamp(index, 0, this.#keys.length) : undefined;
        this.#setShouldUseInitValue(true);
        this.#setKeys(this.#keys.toSpliced(safeIndex ?? this.#keys.length, 0, createId()));
        this.#updateKey = this.#bridge.addArrayFieldRow(this.#field, safeIndex);
    };

    addWithInitValue = (row: unknown, index?: number) => {
        const added = this.#bridge.addArrayFieldRowWithValue(this.#field, row, index);
        // An appended row is found by the next sync. An inserted one needs a key of its own at its position: keys
        // regenerated by position would stay with the old rows, whose fields would keep stale values.
        if (typeof index === 'number') {
            this.#setKeys(this.#keys.toSpliced(added.index, 0, createId()));
            this.#updateKey = added.updateKey;
            // the new row's fields take the given row value, as after a sync
            this.#setShouldUseInitValue(false);
        }
    };

    remove = (index: number) => {
        this.#bridge.removeArrayFieldRow(this.#field, index);
        this.#setKeys(this.#keys.toSpliced(index, 1));
    };

    /** Moves the row at `from` to `to`, both clamped to the rows; the row keeps its key */
    move = (from: number, to: number) => {
        const last = this.#keys.length - 1;
        const source = clamp(from, 0, last);
        const target = clamp(to, 0, last);
        if (source === target) {
            return;
        }
        this.#setKeys(this.#keys.toSpliced(source, 1).toSpliced(target, 0, this.#keys[source]));
        this.#updateKey = this.#bridge.moveArrayFieldRow(this.#field, source, target);
    };
}
