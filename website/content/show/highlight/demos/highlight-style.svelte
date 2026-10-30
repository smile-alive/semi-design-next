<script lang="ts">
    import { Highlight } from '@fibrae/semi-ui-svelte';

    const sourceString = '从 Semi Design 到 Any Design 快速定义你的设计系统，并应用在设计稿和代码中';
    const searchWords = ['设计系统', 'Semi Design'];

    const baseStyle = {
        borderRadius: '6px',
        marginLeft: '4px',
        marginRight: '4px',
        paddingLeft: '4px',
        paddingRight: '4px',
        color: 'var(--semi-white)',
    };
    const tealStyle = { ...baseStyle, backgroundColor: 'var(--semi-teal-7)' };
    const primaryStyle = { ...baseStyle, backgroundColor: 'var(--semi-color-primary)' };
</script>

<h2>
    <Highlight highlightStyle={tealStyle} {searchWords} {sourceString} />
</h2>
<h2>
    <Highlight highlightStyle={primaryStyle} {searchWords} {sourceString} />
</h2>
