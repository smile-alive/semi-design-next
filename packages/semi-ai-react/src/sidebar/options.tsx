import React, { Fragment } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
import Button from '@fibrae/semi-ui-react/button/index';
import type { OptionProps } from './interface';

const prefixCls = cssClasses.OPTIONS;

function Option({ renderOptionItem, options, onChange, activeKey }: OptionProps) {
    // renderOptionItem always gets a callable handler, even when the owner passes no onActiveOptionChange
    const handleChange = (e: React.MouseEvent, key: string) => onChange?.(e, key);

    return (
        <div className={prefixCls}>
            {options?.map((option) => {
                const { icon, name, key } = option;
                if (typeof renderOptionItem === 'function') {
                    return <Fragment key={key}>{renderOptionItem(option, handleChange)}</Fragment>;
                }
                return (
                    <Button
                        key={key}
                        className={clsx(`${prefixCls}-button`, {
                            [`${prefixCls}-normal`]: activeKey !== key,
                        })}
                        aria-pressed={activeKey === key}
                        icon={icon}
                        onClick={(e) => handleChange(e, option.key)}
                    >
                        {name}
                    </Button>
                );
            })}
        </div>
    );
}

export default React.memo(Option);
