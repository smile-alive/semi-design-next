import React from 'react';
export interface VirtualRowProps {
    index: number;
    data: Record<string, any>;
    style?: React.CSSProperties;
}

// memo: a scroll renders only VirtualList, which passes the same data and a cached style to rows that stay in view
function VirtualRow({ index, data, style }: VirtualRowProps) {
    const { visibleOptions, renderOption } = data;
    const option = visibleOptions[index];

    return renderOption(option, index, style);
}

export default React.memo(VirtualRow);
