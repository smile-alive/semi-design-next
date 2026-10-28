import type { GlobalDefaults } from '@fibrae/semi-ui-solid/_utils/semi-global';
import type { AIChatDialogueProps } from './ai-chat-dialogue/interface';
import type { AIChatInputProps } from './ai-chat-input';
import type { ChatProps } from './chat';
import type { AnnotationProps } from './sidebar/annotation';
import type { SideBarProps } from './sidebar/interface';
import type { MCPConfigureProps } from './sidebar/mcp-configure';

declare module '@fibrae/semi-ui-solid/_utils/semi-global' {
    interface OverrideDefaultProps {
        AIChatDialogue?: GlobalDefaults<AIChatDialogueProps>;
        AIChatInput?: GlobalDefaults<AIChatInputProps>;
        Annotation?: GlobalDefaults<AnnotationProps>;
        Chat?: GlobalDefaults<ChatProps>;
        MCPConfigure?: GlobalDefaults<MCPConfigureProps>;
        Sidebar?: GlobalDefaults<SideBarProps>;
    }
}
