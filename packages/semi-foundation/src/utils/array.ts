import { difference, uniq } from 'es-toolkit';

export function differenceUnique<T>(source: T[], removed: T[]) {
    return difference(uniq(source), removed);
}

type CompareFn<T> = (a: T, b: T, sortOrder: 'ascend' | 'descend') => number;
export function withOrderSort<T = any>(fn: CompareFn<T>, order: 'ascend' | 'descend' = 'ascend'): (a: T, b: T) => number {
    switch (order) {
        case 'descend':
            return (a: any, b: any) => {
                const result = Number(fn(a, b, order));
                return result !== 0 ? -result : result;
            };
        case 'ascend':
        default:
            return (a: any, b: any) => fn(a, b, order);
    }
}
