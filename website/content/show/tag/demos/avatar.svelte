<script lang="ts">
    import { Space, Tag } from '@fibrae/semi-ui-svelte';

    const src = '/assets/placeholder/avatar-a.svg';
</script>

<Space align="start" vertical>
    <Tag avatarSrc={src}>焦锐志</Tag>
    <Tag avatarSrc={src} size="large">焦锐志</Tag>
    <Tag avatarSrc={src} closable size="large">焦锐志</Tag>
    <Tag avatarShape="circle" avatarSrc={src}>焦锐志</Tag>
    <Tag avatarShape="circle" avatarSrc={src} size="large">焦锐志</Tag>
    <Tag avatarShape="circle" avatarSrc={src} closable size="large">焦锐志</Tag>
</Space>
