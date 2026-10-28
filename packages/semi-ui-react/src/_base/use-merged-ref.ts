import { type Ref, useMemo } from 'react';
import { mergeRefs } from '../_utils/merge-refs';

type MaybeRef<T> = Ref<T> | null | undefined;

/** One stable callback ref for all the given refs, re-created only when one of them changes identity */
export default function useMergedRef<T>(a: MaybeRef<T>, b: MaybeRef<T>, c?: MaybeRef<T>) {
    return useMemo(() => mergeRefs([a, b, c]), [a, b, c]);
}
