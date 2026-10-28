import clsx from 'clsx';

export function addClass(rawCls?: string, ...classNames: string[]) {
    const classes = (rawCls ?? '').split(/\s+/);
    return clsx(rawCls, ...classNames.filter((cls) => !classes.includes(cls)));
}

export function removeClass(rawCls?: string, ...classNames: string[]) {
    return clsx(...(rawCls ?? '').split(/\s+/).filter((cls) => !classNames.includes(cls)));
}
