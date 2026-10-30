<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import useDefaultProps from '@fibrae/semi-ui-svelte/_base/use-default-props';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import Container from '../container/container.svelte';
    import AnnotationContent from './annotation-content.svelte';
    import type { AnnotationProps } from './interface.js';

    const defaults = useDefaultProps('Annotation');

    // No fallback on the bindables: a bound `undefined` would throw with one
    let {
        visible = $bindable(),
        activeKey = $bindable(),
        title = defaults('title'),
        motion = defaults('motion'),
        resizable = defaults('resizable'),
        minWidth = defaults('minWidth'),
        maxWidth = defaults('maxWidth'),
        defaultSize = defaults('defaultSize'),
        showClose = defaults('showClose'),
        closeOnEsc = defaults('closeOnEsc'),
        info = defaults('info'),
        onChange,
        onClick,
        infoHeader,
        item,
        ...rest
    }: AnnotationProps = $props();

    const locale = useLocale('Sidebar');

    let container: ReturnType<typeof Container> | undefined = $state();

    /** The `.semi-sidebar-container` element; null while hidden */
    export function getRoot() {
        return container?.getRoot() ?? null;
    }
</script>

<Container {...rest} bind:this={container} bind:visible class={[cssClasses.ANNOTATION, rest.class]} {closeOnEsc} {defaultSize} {maxWidth} {minWidth} {motion} {resizable} {showClose} title={title ?? locale().locale.annotationTitle}>
    <AnnotationContent bind:activeKey header={infoHeader} {info} {item} {onChange} {onClick} />
</Container>
