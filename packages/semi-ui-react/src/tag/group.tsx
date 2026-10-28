import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-foundation/tag/constants';
import { getTagListKeys } from '@fibrae/semi-foundation/tag/tag-key';
import useDefaultProps from '../_base/use-default-props';
import Popover from '../popover/index';
import Tag from './index';
import type { TagProps, TagGroupProps, TagSize } from './interface';

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    style: {},
    className: '',
    size: strings.TAG_SIZE[0] as TagSize,
    avatarShape: 'square',
} satisfies Partial<TagGroupProps>;

function TagGroup(rawProps: TagGroupProps) {
    const props = useDefaultProps('TagGroup', rawProps, defaultProps);
    const { style, className, maxTagCount, restCount, size, avatarShape, showPopover, popoverProps, onTagClose, onPlusNMouseEnter, mode, tagList: _tagList, ...rest } = props;

    // strictNullChecks is off, so `mode?: undefined` cannot discriminate the union; the casts carry the mode contract.
    // Read from props: narrowing the destructured `mode` would narrow onTagClose with it, to never under strict mode
    const tagList = props.tagList;
    const tagKeys = props.mode === 'custom' ? [] : getTagListKeys(tagList as TagProps[]);

    const tags: React.ReactNode[] =
        props.mode === 'custom'
            ? (tagList as React.ReactNode[])
            : (tagList as TagProps[]).map((tag, index) => {
                  // plain assignments: React Compiler skips a component that uses logical assignment (||=, ??=)
                  const tagProps: TagProps = { ...tag };
                  tagProps.size = tagProps.size || size;
                  tagProps.avatarShape = tagProps.avatarShape || avatarShape;
                  if (!tagProps.tagKey) {
                      const { children } = tagProps;
                      // the index keeps keys stable across renders, so tags are not remounted
                      tagProps.tagKey = typeof children === 'string' || typeof children === 'number' ? children : index;
                  }
                  return (
                      <Tag
                          {...tagProps}
                          key={tagKeys[index]}
                          onClose={(tagChildren, e, tagKey) => {
                              tagProps.onClose?.(tagChildren, e, tagKey);
                              onTagClose?.(tagChildren, e, tagKey);
                          }}
                      />
                  );
              });

    let content: React.ReactNode = tags;

    if (typeof maxTagCount !== 'undefined') {
        const n = restCount ? restCount : tagList.length - maxTagCount;
        if (n > 0) {
            const nTag = (
                <Tag key="_+n" style={{ backgroundColor: 'transparent' }} closable={false} color="grey" size={size} onMouseEnter={onPlusNMouseEnter}>
                    +{n}
                </Tag>
            );
            content = [
                ...tags.slice(0, maxTagCount),
                showPopover ? (
                    <Popover className={`${prefixCls}-rest-group-popover`} autoAdjustOverflow content={tags.slice(maxTagCount)} position="top" showArrow trigger="hover" {...popoverProps} key="_+n_Popover">
                        {nTag}
                    </Popover>
                ) : (
                    nTag
                ),
            ];
        }
    }

    return (
        <div
            {...rest}
            className={clsx(
                {
                    [`${prefixCls}-group`]: true,
                    [`${prefixCls}-group-max`]: maxTagCount,
                    [`${prefixCls}-group-small`]: size === 'small',
                    [`${prefixCls}-group-large`]: size === 'large',
                },
                className
            )}
            style={style}
        >
            {content}
        </div>
    );
}

export default memo(TagGroup);
