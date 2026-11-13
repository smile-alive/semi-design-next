import { createSignal, splitProps } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { ratingSpec, type RatingSpecProps } from '@test/specs/rating';
import type { SpecMount } from '@test/specs/shared/define-spec';
import Rating from '..';
import ConfigProvider from '../../config-provider';

const mount: SpecMount<RatingSpecProps> = (initial) => {
    const [props, setProps] = createSignal(initial);
    const view = render(() => (
        <ConfigProvider direction={props().direction}>
            <Rating {...splitProps(props(), ['direction', 'ariaLabel'])[1]} aria-label={props().ariaLabel} />
        </ConfigProvider>
    ));
    return {
        container: view.container,
        update: async (next) => {
            setProps((current) => ({ ...current, ...next }));
        },
        unmount: view.unmount,
    };
};

ratingSpec(mount);
