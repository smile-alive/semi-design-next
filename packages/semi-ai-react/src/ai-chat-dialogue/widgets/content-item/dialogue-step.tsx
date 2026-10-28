import React, { useState } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import type { Step } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import { IconStoryStroked, IconChevronDown, IconChevronUp } from '@fibrae/semi-icons-react';
import type { ElementProps } from '@fibrae/semi-ui-react/_base/base';
import Collapsible from '@fibrae/semi-ui-react/collapsible/index';

const prefixCls = cssClasses.PREFIX_STEP;
const { PREFIX_CONTENT } = cssClasses;

export interface DialogueStepWidgetProps extends ElementProps<'div'> {
    steps: Step[];
}

export function DialogueStepWidget({ steps, className, ...rest }: DialogueStepWidgetProps) {
    const [openIndexes, setOpenIndexes] = useState<Set<number>>(() => new Set(steps.map((_, i) => i)));
    const [stepCount, setStepCount] = useState(steps.length);

    // streaming sends a new steps array per chunk: only steps added since the last render open; other choices stay
    if (stepCount !== steps.length) {
        setStepCount(steps.length);
        if (steps.length > stepCount) {
            const next = new Set(openIndexes);
            for (let i = stepCount; i < steps.length; i++) {
                next.add(i);
            }
            setOpenIndexes(next);
        }
    }

    const toggleOpen = (idx: number) => {
        setOpenIndexes((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) {
                next.delete(idx);
            } else {
                next.add(idx);
            }
            return next;
        });
    };

    const completedIcon = () => {
        return <IconStoryStroked className={`${prefixCls}-completed`} />;
    };

    const loadingIcon = () => {
        return (
            <span className={`${PREFIX_CONTENT}-loading`}>
                <span className={`${PREFIX_CONTENT}-loading-item`} />
                <span className={`${PREFIX_CONTENT}-loading-item`} />
                <span className={`${PREFIX_CONTENT}-loading-item`} />
            </span>
        );
    };

    return (
        <div {...rest} className={clsx(`${prefixCls}-wrapper`, className)}>
            {steps.map(({ summary, status, actions }: Step, index) => {
                const isOpen = openIndexes.has(index);
                const expandable = actions?.length > 0;
                const toggleProps = expandable && {
                    'aria-expanded': isOpen,
                    role: 'button',
                    tabIndex: 0,
                    onClick: () => toggleOpen(index),
                    onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleOpen(index);
                        }
                    },
                };
                return (
                    <React.Fragment key={index}>
                        <div className={prefixCls} {...toggleProps}>
                            <div className={`${prefixCls}-prefix`}>{status === 'completed' ? completedIcon() : loadingIcon()}</div>
                            <div className={`${prefixCls}-summary`}>{summary}</div>
                            {expandable && <div className={`${prefixCls}-suffix`}>{isOpen ? <IconChevronUp /> : <IconChevronDown />}</div>}
                        </div>
                        <Collapsible isOpen={isOpen}>
                            <div className={`${prefixCls}-panel`}>
                                <div className={`${prefixCls}-line`} />
                                <div className={`${prefixCls}-action-wrapper`}>
                                    {actions?.map((action, i) => (
                                        <div key={i} className={`${prefixCls}-action`}>
                                            <div className={`${prefixCls}-action-summary`}>{action.summary}</div>
                                            <div className={`${prefixCls}-action-desc`}>
                                                {action.icon}
                                                {action.description}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Collapsible>
                    </React.Fragment>
                );
            })}
        </div>
    );
}
