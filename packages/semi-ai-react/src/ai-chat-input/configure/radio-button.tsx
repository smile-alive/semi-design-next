import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
import RadioGroup from '@fibrae/semi-ui-react/radio/radio-group';
import getConfigureItem from './get-configure-item';

export default getConfigureItem(RadioGroup, {
    className: `${cssClasses.PREFIX}-footer-configure-radio-button`,
    valuePath: 'target.value',
    defaultProps: {
        type: 'button',
    },
});
