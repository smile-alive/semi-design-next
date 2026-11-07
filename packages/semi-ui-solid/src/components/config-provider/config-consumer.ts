import { type JSX, mergeProps, untrack } from 'solid-js';
import type { ContextValue } from './context';
import useConfig from './use-config';

export interface ConfigConsumerProps {
    children: (config: ContextValue) => JSX.Element;
}

export default function ConfigConsumer(props: ConfigConsumerProps) {
    const config = useConfig();

    // children runs once with a view whose fields read the context lazily; re-running it on every change (each
    // breakpoint crossing) would rebuild the subtree and lose its DOM and state
    return untrack(() => props.children(mergeProps(config)));
}
