import { render } from '@testing-library/react';
import type { SpecMount } from '@test/specs/shared/define-spec';
import { tagInputSpec, type TagInputSpecProps } from '@test/specs/tag-input';
import TagInput from '..';

function Fixture({ attrs, ...props }: TagInputSpecProps) {
    return <TagInput {...attrs} {...props} />;
}

const mount: SpecMount<TagInputSpecProps> = (initial) => {
    let props = initial;
    const view = render(<Fixture {...props} />);
    return {
        container: view.container,
        update: async (next) => {
            props = { ...props, ...next };
            view.rerender(<Fixture {...props} />);
        },
        unmount: view.unmount,
    };
};

tagInputSpec(mount);
