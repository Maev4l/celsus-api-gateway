import AWS from 'aws-sdk';
import { ApolloError } from 'apollo-server-lambda';

import loggerFactory from './logger';

const {
  env: { REGION: region },
} = process;
AWS.config.update({ region });

const lambda = new AWS.Lambda();
const logger = loggerFactory.getLogger('resolvers');

const invokeLambda = async (functionName, userId, payload) => {
  const params = {
    FunctionName: functionName,
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({ userId, payload }),
  };
  logger.error(`Params sent: ${JSON.stringify(params)}`);
  try {
    const { Payload: result } = await lambda.invoke(params).promise();
    return JSON.parse(result);
  } catch (e) {
    logger.error(`Failed to invoke function '${functionName}': ${e.message}`);
    throw new ApolloError(e.message);
  }
};

const getLibraries = async (_, __, context) => {
  const { userId } = context;

  const { libraries } = await invokeLambda('get-libraries', userId);

  return libraries;
};

const getLibrary = async (_, args, context) => {
  const { id } = args;
  const { userId } = context;
  const library = await invokeLambda('get-library', userId, { id });
  return library;
};

const getBooksFromLibrary = async (parent, _, context) => {
  const { userId } = context;
  const { id: libraryId } = parent;
  const { books } = await invokeLambda('get-books-from-library', userId, { libraryId });

  return books;
};

const getLibraryForBook = async (parent, _, context) => {
  const { userId } = context;
  const { libraryId: id } = parent;
  logger.info(`Parent: ${JSON.stringify(parent)}`);
  const library = await invokeLambda('get-library', userId, { id });
  return library;
};

const createLibrary = async (_, args, context) => {
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

const modifyLibrary = async (_, args, context) => {
  const { userId } = context;
  const { library } = args;
  const result = await invokeLambda('post-library', userId, { library });
  return result;
};

const deleteLibrary = async (_, args, context) => {
  const { userId } = context;
  const { id } = args;
  const result = await invokeLambda('delete-library', userId, { id });
  return result;
};

const createBook = async (_, args, context) => {
  const { userId } = context;
  const {
    title,
    description,
    isbn10,
    isbn13,
    thumbnail,
    authors,
    tags,
    bookSet,
    bookSetOrder,
    libraryId,
    language,
  } = args;
  const { id } = await invokeLambda('post-book', userId, {
    book: {
      title,
      description,
      isbn10,
      isbn13,
      thumbnail,
      authors,
      tags,
      bookSet,
      bookSetOrder,
      libraryId,
      language,
    },
  });

  return {
    id,
    title,
    description,
    isbn10,
    isbn13,
    thumbnail,
    authors,
    tags,
    bookSet,
    bookSetOrder,
    libraryId,
  };
};

const modifyBook = async (_, args, context) => {
  const { userId } = context;
  const { book } = args;

  const result = await invokeLambda('post-book', userId, { book });
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
    addBook: createBook,
    updateBook: modifyBook,
  },
  LibraryDetail: {
    books: getBooksFromLibrary,
  },
  Book: {
    library: getLibraryForBook,
  },
};
