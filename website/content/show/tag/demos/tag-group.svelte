<script lang="ts">
    import { TagGroup, type TagGroupItem } from '@fibrae/semi-ui-svelte';

    const src = '/assets/placeholder/avatar-a.svg';
    const tagList: TagGroupItem[] = [
        { color: 'light-blue', children: '抖音' },
        { color: 'cyan', children: '火山' },
        { color: 'violet', children: '剪映' },
        { color: 'white', children: '醒图' },
    ];
    const tagList2: TagGroupItem[] = [
        { color: 'white', children: 'Douyin', avatarSrc: src },
        { color: 'white', children: 'Hotsoon', avatarSrc: src },
        { color: 'white', children: 'Capcut', avatarSrc: src },
        { color: 'white', children: 'Xingtu', avatarSrc: src },
    ];
    const divStyle = 'background-color: var(--semi-color-fill-0); height: 35px; width: 300px; display: flex; align-items: center; padding: 0 10px; margin-bottom: 30px';
    const tagGroupStyle = 'display: flex; align-items: center; width: 350px';
</script>

<div style={divStyle}>
    <TagGroup maxTagCount={3} size="large" style={tagGroupStyle} {tagList} />
</div>
<div style={divStyle}>
    <TagGroup avatarShape="circle" maxTagCount={2} showPopover size="large" style={tagGroupStyle} tagList={tagList2} />
</div>
