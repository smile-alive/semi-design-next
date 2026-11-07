import shallowEqualObjects from '@fibrae/semi-foundation/utils/shallow-equal-objects';
import type { TreeRowProps } from './interface';

/** Every re-flatten builds new nodes and isEnd arrays; rows with the same content compare equal and do not re-render */
export function sameRow(a: TreeRowProps | null, b: TreeRowProps | null) {
    if (!a || !b) {
        return a === b;
    }
    const { isEnd: endA, ...restA } = a;
    const { isEnd: endB, ...restB } = b;
    return shallowEqualObjects(restA, restB) && endA.length === endB.length && endA.every((end, i) => end === endB[i]);
}
