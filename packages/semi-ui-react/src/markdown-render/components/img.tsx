import type { PropsWithChildren } from 'react';
import { omit } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
import { IconUploadError } from '@fibrae/semi-icons-react';
import Image, { type ImageProps } from '../../image';
import { useLinkContext } from './link-context';

// capitalised for the hooks rules, though markdown names it `img`
export default function Img(props: PropsWithChildren<ImageProps>) {
    const inLink = useLinkContext();

    return (
        <div className={`${cssClasses.PREFIX}-component-image`}>
            <Image fallback={<IconUploadError />} width="100%" {...(inLink ? { preview: false } : null)} {...omit(props, ['children'])} />
            {/* alt is already the image's accessible name */}
            <div className={`${cssClasses.PREFIX}-component-image-alt`} aria-hidden="true">
                {props.alt}
            </div>
        </div>
    );
}
