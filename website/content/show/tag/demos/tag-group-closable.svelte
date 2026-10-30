<script lang="ts">
    import { TagGroup, type TagCloseEvent, type TagGroupItem } from '@fibrae/semi-ui-svelte';

    let tagList = $state<TagGroupItem[]>([
        { tagKey: '1', color: 'light-blue', children: '抖音', closable: true },
        { tagKey: '3', color: 'cyan', children: '剪映', closable: true },
        { tagKey: '2', color: 'violet', children: '醒图', closable: true },
        { tagKey: '4', color: 'teal', children: '轻颜相机', closable: true },
        { tagKey: '5', color: 'white', children: '飞书', closable: true },
    ]);

    const closeTag = (_event: TagCloseEvent, tagKey: string | number | undefined) => {
        tagList = tagList.filter((tag) => tag.tagKey !== tagKey);
    };
</script>

<div style="background-color: var(--semi-color-fill-0); height: 35px; width: 300px; display: flex; align-items: center; padding: 0 10px; margin-bottom: 30px">
    <TagGroup maxTagCount={3} onTagClose={closeTag} showPopover size="large" style="display: flex; align-items: center; width: 350px" {tagList} />
</div>
