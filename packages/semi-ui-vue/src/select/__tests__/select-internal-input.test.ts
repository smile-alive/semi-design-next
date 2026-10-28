import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import Select from '..';
import semiGlobal from '../../_utils/semi-global';

describe('全局 Input 默认值不给 Select 内部输入框加清除按钮', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('触发器搜索框', async () => {
        semiGlobal.config.overrideDefaultProps = { Input: { showClear: true } };
        const { container } = render(Select, { props: { multiple: true, filter: true, defaultValue: ['a'], optionList: [{ value: 'a', label: 'A' }] } });
        await userEvent.type(container.querySelector('input') as HTMLInputElement, 'a');
        await new Promise((resolve) => setTimeout(resolve));
        expect(container.querySelector('input')).toHaveValue('a');
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-input-clearbtn`)).toBeNull();
    });
});
