import { isServer } from 'solid-js/web';
import type { SsrCase } from './ssr.solid';

// Cases the hydration check must reject. Solid claims nodes by hydration key without comparing tags or text, so only a
// key the server never wrote makes its development build throw
export const ssrCases: SsrCase[] = [
    {
        name: 'hydration/客户端多出节点',
        covers: [],
        render: () =>
            isServer ? (
                <b>a</b>
            ) : (
                <>
                    <b>a</b>
                    <i>b</i>
                </>
            ),
    },
];
