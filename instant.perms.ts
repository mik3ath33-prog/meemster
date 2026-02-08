import type { AppSchema } from './instant.schema';

const perms: AppSchema['perms'] = {
  rules: {
    memes: {
      allow: {
        view: 'true',
        create: 'auth.id != null',
        update: 'auth.id != null && auth.id == data.userId',
        delete: 'auth.id != null && auth.id == data.userId',
      },
    },
    upvotes: {
      allow: {
        view: 'true',
        create: 'auth.id != null',
        update: 'auth.id != null && auth.id == data.userId',
        delete: 'auth.id != null && auth.id == data.userId',
      },
    },
  },
};

export default perms;
