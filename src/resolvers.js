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
  // logger.info(`Params sent: ${JSON.stringify(params)}`);
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

const getLibrary = async (parent, args, context) => {
  const { id } = args;
  const { userId } = context;
  const library = await invokeLambda('get-library', userId, { id });
  return library;
};

const getBooksFromLibrary = async (parent, args, context) => {
  const { userId } = context;
  const { id: libraryId } = parent;
  const { books } = await invokeLambda('get-books-from-library', userId, { libraryId });

  return books;
};

const createLibrary = async (parent, args, context) => {
  const { userId } = context;
  const { name, description } = args;
  const { id } = await invokeLambda('post-library', userId, { library: { name, description } });
  return {
    id,
    name,
    description,
    booksCount: 0,
  };
};

const modifyLibrary = async (parent, args, context) => {
  const { userId } = context;
  const { library } = args;
  const result = await invokeLambda('post-library', userId, { library });
  return result;
};

const deleteLibrary = async (parent, args, context) => {
  const { userId } = context;
  const { id } = args;
  const result = await invokeLambda('delete-library', userId, { id });
  return result;
};

export default {
  Query: {
    ping: () => {
      return 'Pong';
    },
    libraries: getLibraries,
    library: getLibrary,
  },
  Mutation: {
    addLibrary: createLibrary,
    updateLibrary: modifyLibrary,
    removeLibrary: deleteLibrary,
  },
  LibraryDetail: {
    books: getBooksFromLibrary,
  },
};
