/** @jsxImportSource vue */

import { describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import Popover from '../../popover/popover.vue';
import Tooltip from '../../tooltip/tooltip.vue';
import AvatarGroup from '../avatar-group.vue';
import Avatar from '../avatar.vue';

const prefix = 'semi-avatar';
const avatarOf = (node: HTMLElement) => node.closest(`.${prefix}`);
const text = (value: string) => ({ default: () => value });

describe('AvatarGroup 与弹层', () => {
    it('被 Tooltip 包住的头像取组的 size、shape，不影响 +N 计数', () => {
        const view = render(AvatarGroup, {
            props: { size: 'small', shape: 'square', maxCount: 2 },
            slots: {
                default: () => [<Avatar>{text('A')}</Avatar>, <Tooltip trigger="custom">{{ default: () => <Avatar>{text('B')}</Avatar> }}</Tooltip>, <Avatar>{text('C')}</Avatar>],
            },
        });
        expect(avatarOf(view.getByText('B'))).toHaveClass(`${prefix}-small`, `${prefix}-square`);
        expect(view.getByRole('list')).toHaveTextContent('+1');
    });

    it('组值覆盖被 Tooltip 包住的头像自己传的 size、shape，与直接子项一致', () => {
        const view = render(AvatarGroup, {
            props: { size: 'small', shape: 'square' },
            slots: {
                default: () => [
                    <Avatar shape="circle" size="large">
                        {text('A')}
                    </Avatar>,
                    <Tooltip trigger="custom">
                        {{
                            default: () => (
                                <Avatar shape="circle" size="large">
                                    {text('B')}
                                </Avatar>
                            ),
                        }}
                    </Tooltip>,
                ],
            },
        });
        for (const name of ['A', 'B']) {
            expect(avatarOf(view.getByText(name))).toHaveClass(`${prefix}-small`, `${prefix}-square`);
        }
    });

    it('Popover 弹层内的头像不继承组的 size、shape', async () => {
        const view = render(AvatarGroup, {
            props: { size: 'small', shape: 'square' },
            slots: {
                default: () => (
                    <Popover ariaLabel="more" motion={false} trigger="custom" visible>
                        {{
                            default: () => <Avatar>{text('T')}</Avatar>,
                            content: () => <Avatar data-testid="inside">{text('I')}</Avatar>,
                        }}
                    </Popover>
                ),
            },
        });
        expect(avatarOf(view.getByText('T'))).toHaveClass(`${prefix}-small`, `${prefix}-square`);
        const inside = await view.findByTestId('inside');
        expect(inside).toHaveClass(`${prefix}-medium`, `${prefix}-circle`);
    });
});
