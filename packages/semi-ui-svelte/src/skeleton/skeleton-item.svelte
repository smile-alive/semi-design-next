<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/skeleton/constants';
    import '@fibrae/semi-foundation/skeleton/skeleton.scss';
    import type { SkeletonAvatarProps } from './interface.js';

    // The shared block behind Avatar, Image, Title and Button, which differ only in their default type
    let { prefixCls = cssClasses.PREFIX, type, size = 'medium', shape = 'circle', ...rest }: SkeletonAvatarProps & { type: string } = $props();

    const base = $derived(`${prefixCls}-${type}`);
    const avatar = $derived(type.toUpperCase() === 'AVATAR');
</script>

<div {...rest} aria-hidden={rest['aria-hidden'] ?? 'true'} class={[base, rest.class, { [`${base}-${size}`]: avatar, [`${base}-${shape}`]: avatar }]}></div>
