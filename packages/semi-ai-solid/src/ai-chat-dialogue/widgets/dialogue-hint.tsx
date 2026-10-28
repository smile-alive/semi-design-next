import { Index, type JSX, Show } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import type { RenderHintBoxProps } from '../interface';

const { PREFIX_HINT } = cssClasses;

interface HintProps {
    class?: string;
    style?: JSX.CSSProperties | string;
    hints: string[];
    selecting?: boolean;
    onHintClick: (hint: string) => void;
    renderHintBox?: (props: RenderHintBoxProps) => JSX.Element;
}

export default function Hint(props: HintProps) {
    return (
        <section class={clsx(`${PREFIX_HINT}s`, props.class, { [`${PREFIX_HINT}s-selecting`]: props.selecting })} style={props.style}>
            {/* hints may repeat, so items follow the position */}
            <Index each={props.hints}>
                {(hint, index) => (
                    <Show
                        when={props.renderHintBox}
                        keyed
                        fallback={
                            <div
                                class={`${PREFIX_HINT}-item`}
                                role="button"
                                tabIndex={0}
                                onClick={() => props.onHintClick(hint())}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        // Space would scroll, and Enter would press the button onHintClick moved focus to
                                        e.preventDefault();
                                        props.onHintClick(hint());
                                    }
                                }}
                            >
                                <div class={`${PREFIX_HINT}-content`}>{hint()}</div>
                            </div>
                        }
                    >
                        {(render) =>
                            render({
                                get content() {
                                    return hint();
                                },
                                index,
                                onHintClick: () => props.onHintClick(hint()),
                            })
                        }
                    </Show>
                )}
            </Index>
        </section>
    );
}
