import type { GlobalDefaults } from '@fibrae/semi-ui-svelte/_utils/semi-global';
import type { AIChatDialogueProps } from './ai-chat-dialogue/interface.js';
import type { AIChatInputProps } from './ai-chat-input/interface.js';
import type { ChatProps } from './chat/interface.js';
import type { AnnotationProps } from './sidebar/annotation/interface.js';
import type { SideBarProps } from './sidebar/interface.js';
import type { MCPConfigureProps } from './sidebar/mcp-configure/interface.js';

declare module '@fibrae/semi-ui-svelte/_utils/semi-global' {
    interface OverrideDefaultProps {
        AIChatDialogue?: GlobalDefaults<AIChatDialogueProps>;
        AIChatInput?: GlobalDefaults<AIChatInputProps>;
        Annotation?: GlobalDefaults<AnnotationProps>;
        Chat?: GlobalDefaults<ChatProps>;
        MCPConfigure?: GlobalDefaults<MCPConfigureProps>;
        Sidebar?: GlobalDefaults<SideBarProps>;
    }
}
