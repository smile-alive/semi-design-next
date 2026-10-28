import { children, type JSX, Show, splitProps } from 'solid-js';
import { PreContext } from '../context';

export default function Pre(props: JSX.HTMLAttributes<HTMLPreElement>) {
    const [local, rest] = splitProps(props, ['children']);

    // set while the children are created below; only the Semi code reports itself, so a replacement keeps the pre
    let highlighted = false;

    const resolved = children(() => <PreContext.Provider value={{ markHighlighted: () => (highlighted = true) }}>{local.children}</PreContext.Provider>);

    const isBare = () => highlighted && resolved.toArray().filter((node) => typeof node !== 'string' || node.trim() !== '').length === 1;

    return (
        <Show when={isBare()} fallback={<pre {...rest}>{resolved()}</pre>}>
            {resolved()}
        </Show>
    );
}
