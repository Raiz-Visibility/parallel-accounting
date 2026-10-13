import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    category: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    readTime: z.string().optional(),
    author: z.string().default('Kevin Loo'),
    // Sample content from the design, standing in for a real post. Flagged in dev.
    sample: z.boolean().default(false),
    cta: z.object({ heading: z.string(), text: z.string() }).optional(),
  }),
});

export const collections = { blog };
