import { constraintDirective, constraintDirectiveTypeDefs } from 'graphql-constraint-directive';
import { ApolloServer } from 'apollo-server-lambda';

import schema from './schemas/schema.gql';
import resolvers from './resolvers';

const server = new ApolloServer({
  typeDefs: [constraintDirectiveTypeDefs, schema],
  schemaTransforms: [constraintDirective()],
  resolvers,
  context: ({ event, context }) => {
    const {
      requestContext: {
        authorizer: {
          claims: { sub },
        },
      },
    } = event;

    const { functionName } = context;

    return {
      functionName,
      userId: sub,
    };
  },
});

// eslint-disable-next-line import/prefer-default-export
export const graphqlHandler = server.createHandler({
  cors: {
    origin: true,
    credentials: true,
  },
});
