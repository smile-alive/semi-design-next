import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';
import { frameworks } from './lib/frameworks';

// One directory per page: content/<category>/<page>/index.<locale>.mdx, demos in the sibling demos/
const docs = defineCollection({
    loader: glob({
        pattern: '**/index.*.mdx',
        base: './content',
        // The id keeps the path (basic/button/index.zh-CN); routes derive from it
        generateId: ({ entry }) => entry.replace(/\.mdx$/, ''),
    }),
    schema: z.object({
        title: z.string(),
        brief: z.string().optional(),
        order: z.number(),
        icon: z.string().optional(),
        showNew: z.boolean().optional(),
        frameworks: z.array(z.enum(frameworks)).nonempty().optional(),
    }),
});

export const collections = { docs };
