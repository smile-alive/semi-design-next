import { createSignal, splitProps } from 'solid-js';
import { render } from '@solidjs/testing-library';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { tagInputSpec, type TagInputSpecProps } from '@test/specs/tag-input';
import TagInput from '..';

const mount: SpecMount<TagInputSpecProps> = (initial) => {
    const [props, setProps] = createSignal(initial);
    const view = render(() => <TagInput {...props().attrs} {...splitProps(props(), ['attrs'])[1]} />);
    return {
        container: view.container,
        update: async (next) => {
            setProps((current) => ({ ...current, ...next }));
        },
        unmount: view.unmount,
    };
};

tagInputSpec(mount);
