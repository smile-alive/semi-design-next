import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import TagInput from '..';
import semiGlobal from '../../_utils/semi-global';

describe('全局 Input 默认值不给 TagInput 内部输入框加清除按钮', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('内部输入框', async () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true } };
        const { container } = render(TagInput, { props: { defaultValue: ['a'] } });
        await userEvent.type(container.querySelector('input') as HTMLInputElement, 'b');
        await new Promise((resolve) => setTimeout(resolve));
        expect(container.querySelector('input')).toHaveValue('b');
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
    });
});
