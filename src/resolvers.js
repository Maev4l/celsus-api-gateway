import AWS from 'aws-sdk';
import { ApolloError } from 'apollo-server-lambda';

import loggerFactory from './logger';

AWS.config.region = 'eu-central-1';

const lambda = new AWS.Lambda();
const logger = loggerFactory.getLogger('resolvers');

const invokeLambda = async (functionName, userId, payload) => {
  const params = {
    FunctionName: functionName,
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({ userId, payload }),
  };
  try {
    const { Payload: result } = await lambda.invoke(params).promise();
    return JSON.parse(result);
  } catch (e) {
    logger.error(`Failed to invoke function '${functionName}': ${e.message}`);
    throw new ApolloError(e.message);
  }
};

const getLibraries = async (parent, args, context) => {
  const { userId } = context;

  const { libraries } = await invokeLambda('get-libraries', userId);

  return libraries;
};

const getBooks = async (parent, args, context) => {
  const { userId } = context;
  const { id: libraryId } = parent;
  const { books } = await invokeLambda('get-books', userId, {});

  return books.filter((b) => b.library.id === libraryId);
};

export default {
  Query: {
    ping: () => {
      return 'Pong';
    },
    libraries: getLibraries,
  },
  Library: {
    books: getBooks,
  },
};
