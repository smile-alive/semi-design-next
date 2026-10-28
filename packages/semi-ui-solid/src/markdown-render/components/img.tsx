import { cssClasses } from '@fibrae/semi-foundation/markdown-render/constants';
import { IconUploadError } from '@fibrae/semi-icons-solid';
import Image, { type ImageProps } from '../../image';
import { useLinkContext, useParagraphContext } from '../context';

export default function Img(props: ImageProps) {
    const inLink = useLinkContext();
    const paragraph = useParagraphContext();

    return (
        <div ref={() => paragraph?.markImage()} class={`${cssClasses.PREFIX}-component-image`}>
            <Image fallback={<IconUploadError />} width="100%" preview={inLink ? false : undefined} {...props} />
            {/* alt is already the image's accessible name */}
            <div class={`${cssClasses.PREFIX}-component-image-alt`} aria-hidden="true">
                {props.alt}
            </div>
        </div>
    );
}
