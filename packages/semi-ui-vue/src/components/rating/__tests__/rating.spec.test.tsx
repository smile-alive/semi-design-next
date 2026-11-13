/** @jsxImportSource vue */
import { defineComponent, nextTick, shallowReactive } from 'vue';
import { ratingSpec, type RatingSpecProps } from '@test/specs/rating';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { render } from '@test/utils/vue';
import Rating from '..';
import ConfigProvider from '../../config-provider';

const mount: SpecMount<RatingSpecProps> = (initial) => {
    const state = shallowReactive({ ...initial });
    const view = render(
        defineComponent(() => () => {
            const { direction, value, character, onKeyDown, ...props } = state;
            return (
                <ConfigProvider direction={direction}>
                    {() => (
                        <Rating {...props} modelValue={value} onKeydown={onKeyDown}>
                            {character === undefined ? undefined : { character: () => character }}
                        </Rating>
                    )}
                </ConfigProvider>
            );
        })
    );
    return {
        container: view.container as HTMLElement,
        update: async (next) => {
            Object.assign(state, next);
            await nextTick();
        },
        unmount: () => view.unmount(),
    };
};

ratingSpec(mount);
