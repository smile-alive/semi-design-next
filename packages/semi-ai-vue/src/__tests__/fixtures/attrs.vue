<script setup lang="ts">
    import AIChatDialogue from '../../components/ai-chat-dialogue/index';
    import AIChatInput from '../../components/ai-chat-input/index';
    import Chat from '../../components/chat/index';
    import Annotation from '../../components/sidebar/annotation/index';
    import Sidebar from '../../components/sidebar/index';
    import MCPConfigure from '../../components/sidebar/mcp-configure/index';

    const roleConfig = { user: { name: 'User' } };
    const onKeydown = (event: KeyboardEvent) => event.key;
</script>

<template>
    <AIChatDialogue id="probe" data-probe="" :roleConfig="roleConfig" @keydown="onKeydown" />
    <AIChatInput />
    <Chat id="probe" data-probe="" @keydown="onKeydown" />
    <Sidebar visible />
    <Sidebar.Container id="probe" data-probe="" visible @keydown="onKeydown" />
    <Annotation visible />
    <MCPConfigure visible />
    <AIChatDialogue.Reasoning id="probe" data-probe="" status="completed" :summary="[]" @keydown="onKeydown" />
    <AIChatDialogue.Step id="probe" data-probe="" :steps="[]" @keydown="onKeydown" />
    <AIChatDialogue.Annotation id="probe" :annotation="[]" data-probe="" :maxCount="3" @keydown="onKeydown" />
    <Sidebar.FileContent />
    <Sidebar.CodeContent />
    <Sidebar.FileItem id="probe" data-probe="" @keydown="onKeydown" />
    <Sidebar.CodeItem id="probe" content="x" data-probe="" @keydown="onKeydown" />
    <Annotation.AnnotationContent />
</template>
