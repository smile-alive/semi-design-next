import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import Select from '@fibrae/semi-ui-vue/select/index';
import getConfigureItem from './get-configure-item';

export default getConfigureItem(Select, { className: `${cssClasses.PREFIX}-footer-configure-select` });
