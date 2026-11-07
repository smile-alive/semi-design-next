import * as React from 'react';
import clsx from 'clsx';

interface IndentProps {
    prefixcls: string;
    level: number;
    isEnd: boolean[];
    showLine: boolean;
}

function Indent({ prefixcls, level, isEnd, showLine }: IndentProps) {
    const baseClassName = `${prefixcls}-indent-unit`;

    const list = Array.from({ length: level }, (_, i) => (
        <span
            key={i}
            className={clsx(baseClassName, {
                [`${baseClassName}-end`]: isEnd[i],
            })}
        />
    ));

    return (
        <span
            className={clsx(`${prefixcls}-indent`, {
                [`${prefixcls}-indent-show-line`]: showLine,
            })}
            aria-hidden="true"
        >
            {list}
        </span>
    );
}

export default React.memo(Indent);
