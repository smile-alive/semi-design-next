import { type JSX, Index, Show } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
import { IconArrowRight } from '@fibrae/semi-icons-solid';
import type { RenderHintBoxProps } from './interface';

const { PREFIX_HINT } = cssClasses;

interface HintProps {
    class?: string;
    style?: JSX.CSSProperties | string;
    value: string[];
    onHintClick?: (item: string) => void;
    renderHintBox?: (props: RenderHintBoxProps) => JSX.Element;
}

export default function Hint(props: HintProps) {
    return (
        <section class={clsx(`${PREFIX_HINT}s`, props.class)} style={props.style}>
            {/* hints may repeat, so rows follow the position */}
            <Index each={props.value}>
                {(item, index) => (
                    <Show
                        when={props.renderHintBox}
                        keyed
                        fallback={
                            <button type="button" class={`${PREFIX_HINT}-item`} onClick={() => props.onHintClick?.(item())}>
                                <span class={`${PREFIX_HINT}-content`}>{item()}</span>
                                <IconArrowRight class={`${PREFIX_HINT}-icon`} />
                            </button>
                        }
                    >
                        {(render) =>
                            render({
                                get content() {
                                    return item();
                                },
                                index,
                                onHintClick: () => props.onHintClick?.(item()),
                            })
                        }
                    </Show>
                )}
            </Index>
        </section>
    );
}
