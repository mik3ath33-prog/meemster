import { init } from '@instantdb/react';
import schema from '../instant.schema';
import perms from '../instant.perms';

export const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  schema,
  perms,
});
