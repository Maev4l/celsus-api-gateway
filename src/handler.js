import { ApolloServer } from 'apollo-server-lambda';

import schema from './schema.graphql';
import resolvers from './resolvers';

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  context: (event, context) => ({
    event,
    context,
  }),
});

// eslint-disable-next-line import/prefer-default-export
export const graphqlHandler = server.createHandler({
  cors: {
    origin: true,
    credentials: true,
  },
});
