<script lang="ts">
    import { AIChatInput, type AIChatInputReference as Reference } from '@fibrae/semi-ai-svelte';

    const uploadProps = { action: 'https://api.semi.design/upload' };
    let references = $state<Reference[]>([
        {
            id: '1',
            type: 'text',
            content: '测试文本，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字,这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字，这里是一段很长的文字',
        },
        {
            id: '2',
            name: '飞书文档.docx',
        },
        {
            id: '3',
            name: '飞书文档.pdf',
        },
        {
            id: '4',
            name: 'Music.mp4',
        },
        {
            id: '5',
            name: 'Image.jpeg',
            url: '/assets/placeholder/avatar-b.svg',
        },
        {
            id: '6',
            name: 'code.json',
        },
    ]);

    const handleReferenceDelete = (item: Reference) => {
        references = references.filter((ref) => ref.id !== item.id);
    };

    const handleReferenceClick = (item: Reference) => {
        console.log('点击了引用', item);
    };
</script>

<AIChatInput onReferenceClick={handleReferenceClick} onReferenceDelete={handleReferenceDelete} placeholder="用于查看引用内容的用例" {references} style="margin: 12px" {uploadProps} />
