import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import { RadioGroup } from '@fibrae/semi-ui-vue/radio/index';
import getConfigureItem from './get-configure-item';

export default getConfigureItem(RadioGroup, {
    className: `${cssClasses.PREFIX}-footer-configure-radio-button`,
    defaultProps: { type: 'button' },
});
