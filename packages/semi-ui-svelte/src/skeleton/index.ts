import AvatarPart from './avatar.svelte';
import ButtonPart from './button.svelte';
import ImagePart from './image.svelte';
import ParagraphPart from './paragraph.svelte';
import SkeletonBase from './skeleton.svelte';
import TitlePart from './title.svelte';

// Svelte components are functions, so the parts attach to the component itself
export const Skeleton: typeof SkeletonBase & {
    Avatar: typeof AvatarPart;
    Title: typeof TitlePart;
    Button: typeof ButtonPart;
    Paragraph: typeof ParagraphPart;
    Image: typeof ImagePart;
} = Object.assign(SkeletonBase, { Avatar: AvatarPart, Title: TitlePart, Button: ButtonPart, Paragraph: ParagraphPart, Image: ImagePart });
export { default as SkeletonAvatar } from './avatar.svelte';
export { default as SkeletonButton } from './button.svelte';
export { default as SkeletonImage } from './image.svelte';
export { default as SkeletonParagraph } from './paragraph.svelte';
export { default as SkeletonTitle } from './title.svelte';
export type { SkeletonAvatarProps, SkeletonBasicProps, SkeletonParagraphProps, SkeletonProps } from './interface.js';
