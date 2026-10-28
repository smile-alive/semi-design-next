import type { ComponentOrder } from '../component-order.ts';

export const solidComponentOrder: ComponentOrder = {
    calls: {
        useDefaultProps: ['props'],
        mergeProps: ['props'],
        splitProps: ['props'],
        splitControlAttrs: ['props'],
        omitFormInjected: ['props'],
        useContext: ['context'],
        createSignal: ['state'],
        createUniqueId: ['state', 'opaque'],
        createMemo: ['derived'],
        children: ['derived'],
        createEffect: ['effect', 'effect'],
        createRenderEffect: ['effect', 'effect'],
        createComputed: ['effect', 'effect'],
        // Solid's onMount is an effect in the createEffect queue, so it keeps its order among effects
        onMount: ['lifecycle', 'effect'],
        onCleanup: ['lifecycle', 'lifecycle'],
    },
    targets: [{ kind: 'components', pathspecs: ['packages/semi-ui-solid/src/*.tsx', 'packages/semi-ai-solid/src/*.tsx'] }],
};
