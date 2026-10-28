import { getCustomSlotAttribute } from '@fibrae/semi-ai-foundation/ai-chat-input/utils';
import AIChatInput from './ai-chat-input';
import Configure from './configure';

export { default as getConfigureItem } from './configure/get-configure-item';
export type { ConfigureHandle, ConfigureProps, ConfigureItemOpts, ConfigureItemProps, McpOption, McpProps } from './configure';
export type * from './interface';

export default Object.assign(AIChatInput, { Configure, getCustomSlotAttribute });
