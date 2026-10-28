import type { TestProjectInlineConfiguration } from 'vite-plus';
import { semiInlineJsonWorker, semiStubStyles } from '../../vite.semi.ts';
import { browserBase, browserStyles, compatBrowserProjects, jsdomBase, nodeBase, ssrTestFiles, testFiles, type TestFramework } from '../framework.ts';

function browserProject(): TestProjectInlineConfiguration {
    return {
        extends: true,
        css: browserStyles,
        oxc: { jsx: { runtime: 'automatic' } },
        plugins: [semiInlineJsonWorker],
        test: { ...browserBase(), name: 'react-browser', include: testFiles('react', true), setupFiles: ['./vitest/react/react.setup.ts', './vitest/browser.setup.ts'] },
    };
}

export const react: TestFramework = {
    projects: [
        {
            extends: true,
            oxc: { jsx: { runtime: 'automatic' } },
            plugins: [semiStubStyles],
            test: { ...jsdomBase, name: 'react', include: testFiles('react', false), setupFiles: ['./vitest/react/react.setup.ts', './vitest/vitest.setup.ts'] },
        },
        {
            extends: true,
            oxc: { jsx: { runtime: 'automatic' } },
            plugins: [semiStubStyles],
            test: { ...nodeBase, name: 'react-ssr', include: ssrTestFiles('react') },
        },
        browserProject(),
        ...compatBrowserProjects('react', browserProject),
    ],
    coverage: {
        include: ['packages/{semi-ui-react,semi-ai-react}/src/**/*.{js,jsx,mjs,ts,tsx}'],
        exclude: ['packages/{semi-ui-react,semi-ai-react}/src/index.ts'],
    },
};
