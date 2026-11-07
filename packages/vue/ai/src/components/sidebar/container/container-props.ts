import type { ContainerProps } from './interface';

const keys = ['closeOnEsc', 'defaultSize', 'maxWidth', 'minWidth', 'motion', 'resizable', 'showClose', 'visible'] as const satisfies readonly (keyof ContainerProps)[];

/**
 * The Container props a wrapping component (Sidebar, Annotation, MCPConfigure) passes on. An undefined value makes
 * Container use its own default. The title is left out: each wrapper resolves its own.
 */
export default function pickContainerProps(props: ContainerProps): Omit<ContainerProps, 'title'> {
    return Object.fromEntries(keys.map((key) => [key, props[key]]));
}
