import clsx from 'clsx';

export interface ColSize {
    span?: number;
    order?: number;
    offset?: number;
    push?: number;
    pull?: number;
}

export interface ColClassProps extends ColSize {
    xs?: number | ColSize;
    sm?: number | ColSize;
    md?: number | ColSize;
    lg?: number | ColSize;
    xl?: number | ColSize;
    xxl?: number | ColSize;
}

export function getColClassName(prefixCls: string, { span, order, offset, push, pull, xs, sm, md, lg, xl, xxl }: ColClassProps, className?: string) {
    const prefix = `${prefixCls}-col`;
    // unlike the top-level props, a breakpoint's order, offset, push and pull of 0 still produce a class
    const sizeClasses = Object.entries({ xs, sm, md, lg, xl, xxl }).map(([size, value]) => {
        const sizeProps: ColSize = typeof value === 'number' ? { span: value } : (value ?? {});
        return {
            [`${prefix}-${size}-${sizeProps.span}`]: sizeProps.span !== undefined,
            [`${prefix}-${size}-order-${sizeProps.order}`]: sizeProps.order || sizeProps.order === 0,
            [`${prefix}-${size}-offset-${sizeProps.offset}`]: sizeProps.offset || sizeProps.offset === 0,
            [`${prefix}-${size}-push-${sizeProps.push}`]: sizeProps.push || sizeProps.push === 0,
            [`${prefix}-${size}-pull-${sizeProps.pull}`]: sizeProps.pull || sizeProps.pull === 0,
        };
    });
    return clsx(
        prefix,
        {
            [`${prefix}-${span}`]: span !== undefined,
            [`${prefix}-order-${order}`]: order,
            [`${prefix}-offset-${offset}`]: offset,
            [`${prefix}-push-${push}`]: push,
            [`${prefix}-pull-${pull}`]: pull,
        },
        className,
        sizeClasses
    );
}

export interface RowClassProps {
    type?: 'flex';
    justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between';
    align?: 'top' | 'middle' | 'bottom';
}

export function getRowClassName(prefixCls: string, { type, justify, align }: RowClassProps, className?: string) {
    const prefix = `${prefixCls}-row`;
    return clsx(
        {
            [prefix]: type !== 'flex',
            [`${prefix}-${type}`]: type,
            [`${prefix}-${type}-${justify}`]: type && justify,
            [`${prefix}-${type}-${align}`]: type && align,
        },
        className
    );
}
