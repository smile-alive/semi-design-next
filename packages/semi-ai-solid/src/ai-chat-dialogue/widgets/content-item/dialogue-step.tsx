import { Index, Show, createSignal, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import type { Step } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import { IconChevronDown, IconChevronUp, IconStoryStroked } from '@fibrae/semi-icons-solid';
import type { ElementProps } from '@fibrae/semi-ui-solid/_base/element-props';
import useWatch from '@fibrae/semi-ui-solid/_base/use-watch';
import Collapsible from '@fibrae/semi-ui-solid/collapsible/index';

const prefixCls = cssClasses.PREFIX_STEP;
const { PREFIX_CONTENT } = cssClasses;

export interface DialogueStepWidgetProps extends ElementProps<'div'> {
    steps: Step[];
}

export function DialogueStepWidget(props: DialogueStepWidgetProps) {
    const [local, rest] = splitProps(props, ['steps', 'class']);

    const [openIndexes, setOpenIndexes] = createSignal(new Set(untrack(() => local.steps.map((_, i) => i))));

    // streaming sends a new steps array per chunk: only steps added since then open; other choices stay
    let stepCount = untrack(() => local.steps.length);

    const toggleOpen = (index: number) =>
        setOpenIndexes((prev) => {
            const next = new Set(prev);
            if (!next.delete(index)) {
                next.add(index);
            }
            return next;
        });

    useWatch(
        () => local.steps.length,
        (length) => {
            if (length > stepCount) {
                const next = new Set(openIndexes());
                for (let i = stepCount; i < length; i++) {
                    next.add(i);
                }
                setOpenIndexes(next);
            }
            stepCount = length;
        }
    );

    return (
        <div {...rest} class={clsx(`${prefixCls}-wrapper`, local.class)}>
            {/* steps carry no id, and a streamed chunk replaces each with a new object */}
            <Index each={local.steps}>
                {(step, index) => {
                    const isOpen = () => openIndexes().has(index);
                    const expandable = () => (step().actions?.length ?? 0) > 0;
                    return (
                        <>
                            <div
                                class={prefixCls}
                                aria-expanded={expandable() ? isOpen() : undefined}
                                role={expandable() ? 'button' : undefined}
                                tabIndex={expandable() ? 0 : undefined}
                                onClick={() => expandable() && toggleOpen(index)}
                                onKeyDown={(e) => {
                                    if (expandable() && (e.key === 'Enter' || e.key === ' ')) {
                                        e.preventDefault();
                                        toggleOpen(index);
                                    }
                                }}
                            >
                                <div class={`${prefixCls}-prefix`}>
                                    <Show
                                        when={step().status === 'completed'}
                                        fallback={
                                            <span class={`${PREFIX_CONTENT}-loading`}>
                                                <span class={`${PREFIX_CONTENT}-loading-item`} />
                                                <span class={`${PREFIX_CONTENT}-loading-item`} />
                                                <span class={`${PREFIX_CONTENT}-loading-item`} />
                                            </span>
                                        }
                                    >
                                        <IconStoryStroked class={`${prefixCls}-completed`} />
                                    </Show>
                                </div>
                                <div class={`${prefixCls}-summary`}>{step().summary}</div>
                                <Show when={expandable()}>
                                    <div class={`${prefixCls}-suffix`}>
                                        <Show when={isOpen()} fallback={<IconChevronDown />}>
                                            <IconChevronUp />
                                        </Show>
                                    </div>
                                </Show>
                            </div>
                            <Collapsible isOpen={isOpen()}>
                                <div class={`${prefixCls}-panel`}>
                                    <div class={`${prefixCls}-line`} />
                                    <div class={`${prefixCls}-action-wrapper`}>
                                        <Index each={step().actions ?? []}>
                                            {(action) => (
                                                <div class={`${prefixCls}-action`}>
                                                    <div class={`${prefixCls}-action-summary`}>{action().summary}</div>
                                                    <div class={`${prefixCls}-action-desc`}>
                                                        {action().icon}
                                                        {action().description}
                                                    </div>
                                                </div>
                                            )}
                                        </Index>
                                    </div>
                                </div>
                            </Collapsible>
                        </>
                    );
                }}
            </Index>
        </div>
    );
}
