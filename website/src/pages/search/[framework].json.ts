import type { APIRoute, GetStaticPaths } from 'astro';
import { frameworks, getComponentIndex, type Framework } from '#/lib/docs';

// Fetched on first search open so it does not add to every page's weight
export const getStaticPaths = (() => frameworks.map((framework) => ({ params: { framework } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => Response.json(await getComponentIndex(params.framework as Framework));
