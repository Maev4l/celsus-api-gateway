import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { ApolloError } from 'apollo-server-lambda';
import { DateResolver } from 'graphql-scalars';

import loggerFactory from './logger';

const region = process.env.REGION;

const logger = loggerFactory.getLogger('resolvers');

const lambda = new LambdaClient({ region });

const invokeLambda = async (functionName, userId, payload) => {
  const params = {
    FunctionName: functionName,
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({ userId, payload }),
  };
  logger.debug(`Params sent: ${JSON.stringify(params)}`);
  try {
    const { Payload: result } = await lambda.send(new InvokeCommand(params));
    return JSON.parse(new TextDecoder('utf-8').decode(result));
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
  const { page, pageSize } = variableValues;

  const result = await invokeLambda('get-books-from-library', userId, {
    libraryId,
    page,
    pageSize,
  });
  return result;
};

const getBookSetsFromLibrary = async (parent, _, { userId }) => {
  const { id: libraryId } = parent;
  const { bookSets } = await invokeLambda('get-booksets-from-library', userId, {
    libraryId,
  });

  return bookSets;
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

const getBook = async (_, { id }, { userId }) => {
  const result = await invokeLambda('get-book', userId, { id });
  if (!result) throw new ApolloError(`Unknown book id: ${id} - user: ${userId}`);
  return result;
};

const searchBooks = async (_, { searchQuery }, { userId }) => {
  const { page, pageSize, keywords } = searchQuery;
  const result = await invokeLambda('search-books', userId, { page, keywords, pageSize });
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

const createContact = async (_, { contact }, { userId }) => {
  const { id } = await invokeLambda('post-contact', userId, { contact });

  return { id, ...contact };
};

const modifyContact = async (_, { contact }, { userId }) => {
  const result = await invokeLambda('post-contact', userId, { contact });

  return result;
};

const deleteContact = async (_, { id }, { userId }) => {
  const result = await invokeLambda('delete-contact', userId, { id });
  return result;
};

const getLendings = async (_, { page }, { userId }) => {
  const { itemsPerPage, total, lendings } = await invokeLambda('get-lendings', userId, { page });
  const result = {
    itemsPerPage,
    total,
    lendings: lendings.map(
      ({ contactId: borrowerId, nickname: borrowerNickname, title: bookTitle, ...rest }) => ({
        borrowerId,
        borrowerNickname,
        bookTitle,
        ...rest,
      }),
    ),
  };
  return result;
};

const resizeImage = async (_, { image }) => {
  const result = await invokeLambda('resize-image', null, { format: 'png', ...image });
  const { resizedImage } = result;
  return resizedImage;
};

export default {
  Date: DateResolver,
  Query: {
    ping: () => 'Pong',
    libraries: getLibraries,
    library: getLibrary,
    book: getBook,
    searchBooks,
    contacts: getContacts,
    contact: getContact,
    lendings: getLendings,
  },
  Mutation: {
    addLibrary: createLibrary,
    updateLibrary: modifyLibrary,
    removeLibrary: deleteLibrary,
    addBook: createBook,
    updateBook: modifyBook,
    removeBook: deleteBook,
    addContact: createContact,
    updateContact: modifyContact,
    removeContact: deleteContact,
    resizeImage,
  },
  LibraryDetail: {
    books: getBooksFromLibrary,
    bookSets: getBookSetsFromLibrary,
  },
  Book: {
    library: getLibraryForBook,
  },
};
