import type { GlobalDefaults } from '@fibrae/semi-ui-react/utils/semi-global';
import type { AIChatDialogueProps } from '../components/ai-chat-dialogue/interface';
import type { AIChatInputProps } from '../components/ai-chat-input';
import type { ChatProps } from '../components/chat/interface';
import type { AnnotationProps } from '../components/sidebar/annotation';
import type { SideBarProps } from '../components/sidebar/interface';
import type { MCPConfigureProps } from '../components/sidebar/mcp-configure';

declare module '@fibrae/semi-ui-react/utils/semi-global' {
    interface OverrideDefaultProps {
        AIChatDialogue?: GlobalDefaults<AIChatDialogueProps>;
        AIChatInput?: GlobalDefaults<AIChatInputProps>;
        Annotation?: GlobalDefaults<AnnotationProps>;
        Chat?: GlobalDefaults<ChatProps>;
        MCPConfigure?: GlobalDefaults<MCPConfigureProps>;
        Sidebar?: GlobalDefaults<SideBarProps>;
    }
}
