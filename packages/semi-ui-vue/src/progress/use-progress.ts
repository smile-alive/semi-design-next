import { onScopeDispose, type Ref, ref, watch } from 'vue';
import { createPercentAnimation } from '@fibrae/semi-foundation/progress/utils';

/** The number shown in the text, animated towards `percent`; aria-valuenow reads the target instead */
export function useAnimatedPercent(percent: () => number, motion: () => boolean): Readonly<Ref<number>> {
    const shown = ref(percent());

    const animation = createPercentAnimation((value) => {
        shown.value = value;
    });

    watch(percent, (next, previous) => animation.update(next, previous, shown.value, motion()));

    onScopeDispose(animation.stop);

    return shown;
}
