import SkeletonAvatar from './avatar.vue';
import SkeletonButton from './button.vue';
import SkeletonImage from './image.vue';
import SkeletonParagraph from './paragraph.vue';
import Skeleton from './skeleton.vue';
import SkeletonTitle from './title.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining them with Vue's GlobalComponents.
const SkeletonWithParts: typeof Skeleton & {
    Avatar: typeof SkeletonAvatar;
    Title: typeof SkeletonTitle;
    Button: typeof SkeletonButton;
    Paragraph: typeof SkeletonParagraph;
    Image: typeof SkeletonImage;
} = Object.assign(Skeleton, {
    Avatar: SkeletonAvatar,
    Title: SkeletonTitle,
    Button: SkeletonButton,
    Paragraph: SkeletonParagraph,
    Image: SkeletonImage,
});
export default SkeletonWithParts;
export { SkeletonAvatar, SkeletonImage, SkeletonTitle, SkeletonButton, SkeletonParagraph };
export type * from './interface';
