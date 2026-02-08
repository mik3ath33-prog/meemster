import { i } from '@instantdb/react';

const _schema = i.schema({
  entities: {
    memes: i.entity({
      imageUrl: i.string(),
      userId: i.string(),
      createdAt: i.number(),
      upvoteCount: i.number().optional(),
    }),
    upvotes: i.entity({
      memeId: i.string(),
      userId: i.string(),
      createdAt: i.number(),
    }),
  },
  rooms: {},
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;
export type { AppSchema };
export default schema;
