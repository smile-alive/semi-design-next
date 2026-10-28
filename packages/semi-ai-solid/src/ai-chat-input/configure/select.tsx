import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import Select from '@fibrae/semi-ui-solid/select/index';
import getConfigureItem from './get-configure-item';

export default getConfigureItem(Select, { class: `${cssClasses.PREFIX}-footer-configure-select` });
