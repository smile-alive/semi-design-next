import { children, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
import Typography, { type ParagraphProps } from '../../typography';
import { ParagraphContext } from '../context';

export default function P(props: ParagraphProps) {
    const [local, rest] = splitProps(props, ['children', 'class']);

    // set while the children are created below, before the paragraph reads its tag; only the Semi img reports itself
    let containsImage = false;

    const resolved = children(() => <ParagraphContext.Provider value={{ markImage: () => (containsImage = true) }}>{local.children}</ParagraphContext.Provider>);

    return (
        <Typography.Paragraph component={containsImage ? 'div' : undefined} {...rest} class={clsx(`${cssClasses.PREFIX}-component-p`, local.class)}>
            {resolved()}
        </Typography.Paragraph>
    );
}
