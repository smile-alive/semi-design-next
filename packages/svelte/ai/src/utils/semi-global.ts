import type { GlobalDefaults } from '@fibrae/semi-ui-svelte/utils/semi-global';
import type { AIChatDialogueProps } from '../components/ai-chat-dialogue/interface.js';
import type { AIChatInputProps } from '../components/ai-chat-input/interface.js';
import type { ChatProps } from '../components/chat/interface.js';
import type { AnnotationProps } from '../components/sidebar/annotation/interface.js';
import type { SideBarProps } from '../components/sidebar/interface.js';
import type { MCPConfigureProps } from '../components/sidebar/mcp-configure/interface.js';

declare module '@fibrae/semi-ui-svelte/utils/semi-global' {
    interface OverrideDefaultProps {
        AIChatDialogue?: GlobalDefaults<AIChatDialogueProps>;
        AIChatInput?: GlobalDefaults<AIChatInputProps>;
        Annotation?: GlobalDefaults<AnnotationProps>;
        Chat?: GlobalDefaults<ChatProps>;
        MCPConfigure?: GlobalDefaults<MCPConfigureProps>;
        Sidebar?: GlobalDefaults<SideBarProps>;
    }
}
