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

const getLibraries = async (_, __, { userId }) => {
  const { libraries } = await invokeLambda('get-libraries', userId);

  return libraries;
};

const getLibrary = async (_, { id }, { userId }) => {
  const library = await invokeLambda('get-library', userId, { id });
  return library;
};

const getBooksFromLibrary = async (parent, _, { userId }, { variableValues }) => {
  const { id: libraryId } = parent;
  const { page } = variableValues;
  const result = await invokeLambda('get-books-from-library', userId, { libraryId, page });
  return result;
};

const getLibraryForBook = async ({ libraryId: id }, _, { userId }) => {
  const library = await invokeLambda('get-library', userId, { id });
  return library;
};

const createLibrary = async (_, { library }, { userId }) => {
  const { id } = await invokeLambda('post-library', userId, { library });
  return {
    id,
    ...library,
  };
};

const modifyLibrary = async (_, { library }, { userId }) => {
  const result = await invokeLambda('post-library', userId, { library });
  return result;
};

const deleteLibrary = async (_, { id }, { userId }) => {
  const result = await invokeLambda('delete-library', userId, { id });
  return result;
};

const createBook = async (_, args, { userId }) => {
  const { book } = args;
  const { id } = await invokeLambda('post-book', userId, {
    book,
  });

  return {
    id,
    ...book,
  };
};

const modifyBook = async (_, { book }, { userId }) => {
  const result = await invokeLambda('post-book', userId, { book });
  return result;
};

const deleteBook = async (_, { id }, { userId }) => {
  const result = await invokeLambda('delete-book', userId, { id });
  return result;
};

const searchBooks = async (_, { searchQuery }, { userId }) => {
  const { page, keywords } = searchQuery;
  const result = await invokeLambda('search-books', userId, { page, keywords });
  logger.error(`Search result: ${JSON.stringify(result)}`);
  return result;
};

const getContacts = async (_, __, { userId }) => {
  const { contacts } = await invokeLambda('get-contacts', userId);

  return contacts;
};

const getContact = async (_, { id }, { userId }) => {
  const contact = await invokeLambda('get-contact', userId, { id });

  return contact;
};

export default {
  Query: {
    ping: () => {
      return 'Pong';
    },
    libraries: getLibraries,
    library: getLibrary,
    searchBooks,
    contacts: getContacts,
    contact: getContact,
  },
  Mutation: {
    addLibrary: createLibrary,
    updateLibrary: modifyLibrary,
    removeLibrary: deleteLibrary,
    addBook: createBook,
    updateBook: modifyBook,
    removeBook: deleteBook,
  },
  LibraryDetail: {
    content: getBooksFromLibrary,
  },
  Book: {
    library: getLibraryForBook,
  },
};
