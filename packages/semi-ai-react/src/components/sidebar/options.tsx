import React, { Fragment } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/components/sidebar/constants';
import Button from '@fibrae/semi-ui-react/button/index';
import type { OptionProps, SideBarProps } from './interface';

const prefixCls = cssClasses.OPTIONS;

function Option({ renderOptionItem, options, onChange, activeKey, classNames, styles }: OptionProps & Pick<SideBarProps, 'classNames' | 'styles'>) {
    // renderOptionItem always gets a callable handler, even when the owner passes no onActiveOptionChange
    const handleChange = (e: React.MouseEvent, key: string) => onChange?.(e, key);

    return (
        <div className={clsx(prefixCls, classNames?.options)} style={styles?.options}>
            {options?.map((option) => {
                const { icon, name, key } = option;
                if (typeof renderOptionItem === 'function') {
                    return <Fragment key={key}>{renderOptionItem(option, handleChange)}</Fragment>;
                }
                return (
                    <Button
                        key={key}
                        className={clsx(
                            `${prefixCls}-button`,
                            {
                                [`${prefixCls}-normal`]: activeKey !== key,
                            },
                            classNames?.option
                        )}
                        style={styles?.option}
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
