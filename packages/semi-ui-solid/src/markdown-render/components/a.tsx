import { type JSX, splitProps } from 'solid-js';
import Typography from '../../typography';
import { LinkContext } from '../context';

export default function A(props: JSX.AnchorHTMLAttributes<HTMLAnchorElement>) {
    const [local, link] = splitProps(props, ['children']);

    return (
        <LinkContext.Provider value>
            <Typography.Text link={link}>{local.children}</Typography.Text>
        </LinkContext.Provider>
    );
}
