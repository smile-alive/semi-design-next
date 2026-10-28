import React, { memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/avatar/constants';
import flattenChildren from '../_base/flatten-children';
import { usePopupLayer } from '../_base/popup-layer';
import useDefaultProps from '../_base/use-default-props';
import useLocale from '../locale/use-locale';
import { AvatarGroupContext } from './context';
import Avatar from './index';
import type { AvatarGroupProps, AvatarProps } from './interface';
import { getAvatarText } from './text';

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    size: 'medium',
    shape: 'circle',
    overlapFrom: 'start',
} satisfies Partial<AvatarGroupProps>;

function renderMoreAvatar(restNumber: number, restAvatars: React.ReactNode[], renderMore: AvatarGroupProps['renderMore'], moreLabel: string, itemProps: Pick<AvatarProps, 'size' | 'shape' | 'className'>, layer?: symbol) {
    if (typeof renderMore === 'function') {
        return (
            <AvatarGroupContext key="_+n" value={{ inGroup: true, layer, moreItem: itemProps }}>
                {renderMore(restNumber, restAvatars)}
            </AvatarGroupContext>
        );
    }
    const restAvatarAlt = restAvatars.reduce<string>((pre, cur) => {
        if (!React.isValidElement<AvatarProps>(cur)) {
            return pre;
        }
        const { children, alt } = cur.props;
        const avatarInfo = alt ?? getAvatarText(children) ?? '';
        if (avatarInfo.length === 0) {
            return pre;
        }
        return pre.length > 0 ? `${pre},${avatarInfo}` : avatarInfo;
    }, '');
    return (
        <Avatar key="_+n" {...itemProps} className={clsx(`${prefixCls}-item-more`, itemProps.className)} alt={restAvatarAlt.length > 0 ? `${moreLabel}: ${restAvatarAlt}` : moreLabel}>
            {`+${restNumber}`}
        </Avatar>
    );
}

function AvatarGroup(rawProps: AvatarGroupProps) {
    const { ref, children, maxCount, overlapFrom, size, shape, renderMore, className, ...rest } = useDefaultProps('AvatarGroup', rawProps, defaultProps);

    const { locale } = useLocale('Avatar');
    const layer = usePopupLayer();

    let inner: React.ReactNode;

    const overlapClassName = (index: number) =>
        clsx({
            [`${prefixCls}-item-start-${index}`]: overlapFrom === 'start',
            [`${prefixCls}-item-end-${index}`]: overlapFrom === 'end',
        });

    if (children) {
        const avatars = flattenChildren(children);
        const hasMore = typeof maxCount === 'number' && avatars.length > maxCount;
        const visible = hasMore ? avatars.slice(0, maxCount) : avatars;
        // Through context, so an Avatar inside a Tooltip or Popover gets its overlap class too; other elements still
        // take the class as a prop, a direct Avatar is skipped there to get it once
        const items: React.ReactNode[] = visible.map((item, index) => (
            <AvatarGroupContext key={React.isValidElement(item) ? item.key : index} value={{ inGroup: true, layer, item: { size, shape, className: overlapClassName(index) } }}>
                {React.isValidElement<AvatarProps>(item) && item.type !== Avatar ? React.cloneElement(item, { className: clsx(item.props.className, overlapClassName(index)) }) : item}
            </AvatarGroupContext>
        ));
        if (hasMore) {
            items.push(renderMoreAvatar(avatars.length - maxCount, avatars.slice(maxCount), renderMore, locale.more.replace('${count}', String(avatars.length - maxCount)), { size, shape, className: overlapClassName(maxCount) }, layer));
        }
        inner = items;
    }

    return (
        <div role="list" {...rest} ref={ref} className={clsx(`${prefixCls}-group`, className)}>
            <AvatarGroupContext value={{ inGroup: true, layer }}>{inner}</AvatarGroupContext>
        </div>
    );
}

export default memo(AvatarGroup);
