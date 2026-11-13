import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { createStore } from '@fibrae/semi-ui-svelte/__tests__/store.svelte';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { tagInputSpec, type TagInputSpecProps } from '@test/specs/tag-input';
import TagInputSpecFixture from './tag-input-spec-fixture.svelte';

const mount: SpecMount<TagInputSpecProps> = (props) => {
    const store = createStore<TagInputSpecProps>(props);
    const view = render(TagInputSpecFixture, { props: { store } });
    flushSync();
    return {
        container: view.container,
        update: async (next) => {
            Object.assign(store, next);
            flushSync();
        },
        unmount: view.unmount,
    };
};

tagInputSpec(mount);
