import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/float-button/constants';
import '@fibrae/semi-foundation/float-button/float-button.scss';
import useDefaultProps from '../_base/use-default-props';
import Badge from '../badge';
import type { FloatButtonProps } from './interface';
import renderAction from './render-action';

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    shape: 'round',
    colorful: false,
    size: 'default',
} satisfies Partial<FloatButtonProps>;

export default function FloatButton(rawProps: FloatButtonProps) {
    const { className, colorful, size, icon, badge, shape, disabled, ...rest } = useDefaultProps('FloatButton', rawProps, defaultProps);

    // a span: a native button or link takes phrasing content only
    const body = (
        <span
            className={clsx(`${prefixCls}-body`, {
                [`${prefixCls}-${shape}`]: shape,
                [`${prefixCls}-colorful`]: colorful,
                [`${prefixCls}-disabled`]: disabled,
                [`${prefixCls}-${size}`]: size,
            })}
        >
            {icon}
        </span>
    );

    return renderAction({
        ...rest,
        disabled,
        className: clsx(prefixCls, className, {
            [`${prefixCls}-${size}`]: size,
            [`${prefixCls}-${shape}`]: shape,
        }),
        children: badge ? <Badge {...badge}>{body}</Badge> : body,
    });
}
