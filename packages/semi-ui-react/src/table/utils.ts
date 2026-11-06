// compat merge accepts an undefined source and deep-merges component maps while keeping memo/forwardRef objects as is
import { merge } from 'es-toolkit/compat';
import { getDefaultComponents } from '@fibrae/semi-foundation/table/utils';
import type { TableComponents, Virtualized } from './interface';

export function mergeComponents(components: TableComponents, virtualized: Virtualized) {
    return merge(getDefaultComponents(Boolean(virtualized)), components);
}

export { cloneDeep } from '../_utils';
