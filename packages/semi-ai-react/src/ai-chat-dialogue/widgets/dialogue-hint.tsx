import React from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
const { PREFIX_HINT } = cssClasses;

interface HintProps {
    className?: string;
    style?: React.CSSProperties;
    hints?: string[];
    selecting?: boolean;
    onHintClick?: (item: string) => void;
    renderHintBox?: (props: { content: string; index: number; onHintClick: () => void }) => React.ReactNode;
}

function Hint({ hints, onHintClick, renderHintBox, className, style, selecting }: HintProps) {
    return (
        <section
            className={clsx(`${PREFIX_HINT}s`, {
                [className]: !!className,
                [`${PREFIX_HINT}s-selecting`]: selecting,
            })}
            style={style}
        >
            {hints.map((item: string, index: number) => {
                if (renderHintBox) {
                    return (
                        <React.Fragment key={index}>
                            {renderHintBox({
                                content: item,
                                index: index,
                                onHintClick: () => {
                                    onHintClick?.(item);
                                },
                            })}
                        </React.Fragment>
                    );
                }
                return (
                    <div
                        key={index}
                        className={`${PREFIX_HINT}-item`}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                            onHintClick?.(item);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                // Space would scroll, and Enter would press the button onHintClick moved focus to
                                e.preventDefault();
                                onHintClick?.(item);
                            }
                        }}
                    >
                        <div className={`${PREFIX_HINT}-content`}>{item}</div>
                    </div>
                );
            })}
        </section>
    );
}

export default React.memo(Hint);
