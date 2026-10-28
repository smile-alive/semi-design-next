import React, { Fragment } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
import { IconArrowRight } from '@fibrae/semi-icons-react';
const { PREFIX_HINT } = cssClasses;

interface HintProps {
    className?: string;
    style?: React.CSSProperties;
    value?: string[];
    onHintClick?: (item: string) => void;
    renderHintBox?: (props: { content: string; index: number; onHintClick: () => void }) => React.ReactNode;
}

function Hint({ value, onHintClick, renderHintBox, className, style }: HintProps) {
    return (
        <section
            className={clsx(`${PREFIX_HINT}s`, {
                [className]: !!className,
            })}
            style={style}
        >
            {value.map((item, index) => {
                if (renderHintBox) {
                    return (
                        <Fragment key={index}>
                            {renderHintBox({
                                content: item,
                                index: index,
                                onHintClick: () => {
                                    onHintClick?.(item);
                                },
                            })}
                        </Fragment>
                    );
                }
                return (
                    <button
                        key={index}
                        type="button"
                        className={`${PREFIX_HINT}-item`}
                        onClick={() => {
                            onHintClick?.(item);
                        }}
                    >
                        <span className={`${PREFIX_HINT}-content`}>{item}</span>
                        <IconArrowRight className={`${PREFIX_HINT}-icon`} />
                    </button>
                );
            })}
        </section>
    );
}

export default React.memo(Hint);
