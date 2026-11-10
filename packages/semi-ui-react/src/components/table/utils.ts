import { isPlainObject, mergeWith } from 'es-toolkit';
import { getDefaultComponents } from '@fibrae/semi-foundation/components/table/utils';
import type { TableComponents, Virtualized } from './interface';

// A user component replaces the default tag as is: the default merge would copy memo/forwardRef objects, which are plain objects
export function mergeComponents(components: TableComponents, virtualized: Virtualized) {
    return mergeWith(getDefaultComponents(Boolean(virtualized)), components ?? {}, (target, source) => (isPlainObject(target) ? undefined : source));
}

export { cloneDeep } from '../../utils';
