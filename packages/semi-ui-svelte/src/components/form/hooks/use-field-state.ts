import * as ObjectUtil from '@fibrae/semi-foundation/utils/object';
import type { FieldError } from '../interface.js';
import { type FieldPath, readPath } from '../utils.js';
import useFormState from './use-form-state.js';

export default function useFieldState(field: FieldPath): () => { value: any; error?: FieldError; touched?: boolean } {
    const formState = useFormState();

    return () => {
        const path = readPath(field);
        const state = formState();
        return {
            value: ObjectUtil.get(state.values ?? {}, path),
            error: ObjectUtil.get(state.errors ?? {}, path),
            touched: ObjectUtil.get(state.touched ?? {}, path),
        };
    };
}
