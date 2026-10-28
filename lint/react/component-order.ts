import type { ComponentOrder } from '../component-order.ts';

export const reactComponentOrder: ComponentOrder = {
    calls: {
        useDefaultProps: ['props'],
        use: ['context'],
        useContext: ['context'],
        useState: ['state'],
        useRef: ['state'],
        useReducer: ['state'],
        useTransition: ['state'],
        useOptimistic: ['state'],
        useActionState: ['state'],
        // ids come from a per-component counter that composables may also advance
        useId: ['state', 'opaque'],
        useSyncExternalStore: ['state', 'opaque'],
        useMemo: ['derived'],
        useDeferredValue: ['derived'],
        useMergedRef: ['derived'],
        useCallback: ['function'],
        useEffectEvent: ['function'],
        useEffect: ['effect', 'effect'],
        useLayoutEffect: ['effect', 'effect'],
        useInsertionEffect: ['effect', 'effect'],
        useImperativeHandle: ['expose'],
    },
    targets: [
        {
            kind: 'components',
            pathspecs: ['packages/semi-ui-react/src/*.tsx', 'packages/semi-ai-react/src/*.tsx'],
        },
    ],
};
