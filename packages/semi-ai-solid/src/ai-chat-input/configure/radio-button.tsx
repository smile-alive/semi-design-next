import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import { RadioGroup } from '@fibrae/semi-ui-solid/radio/index';
import getConfigureItem from './get-configure-item';

export default getConfigureItem(RadioGroup, {
    class: `${cssClasses.PREFIX}-footer-configure-radio-button`,
    valuePath: 'target.value',
    defaultProps: {
        type: 'button',
    },
});
