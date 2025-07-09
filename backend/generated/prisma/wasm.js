
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.AccountScalarFieldEnum = {
  primarykey: 'primarykey',
  login: 'login',
  email: 'email',
  password: 'password',
  firstName: 'firstName',
  lastName: 'lastName',
  role: 'role',
  createAt: 'createAt',
  editAt: 'editAt',
  avatarUrl: 'avatarUrl',
  status: 'status',
  creator: 'creator'
};

exports.Prisma.RoleScalarFieldEnum = {
  primarykey: 'primarykey',
  name: 'name',
  createAt: 'createAt',
  editAt: 'editAt'
};

exports.Prisma.TeamScalarFieldEnum = {
  primarykey: 'primarykey',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  createdBy: 'createdBy'
};

exports.Prisma.TeamMemberScalarFieldEnum = {
  primarykey: 'primarykey',
  teamId: 'teamId',
  accountId: 'accountId',
  role: 'role',
  joinedAt: 'joinedAt'
};

exports.Prisma.ProjectScalarFieldEnum = {
  primarykey: 'primarykey',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  createdBy: 'createdBy',
  team: 'team',
  status: 'status'
};

exports.Prisma.TaskScalarFieldEnum = {
  primarykey: 'primarykey',
  title: 'title',
  description: 'description',
  project: 'project',
  createdBy: 'createdBy',
  assignedTo: 'assignedTo',
  status: 'status',
  priority: 'priority',
  dueDate: 'dueDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TaskCommentScalarFieldEnum = {
  primarykey: 'primarykey',
  taskId: 'taskId',
  account: 'account',
  comment: 'comment',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TaskAttachmentScalarFieldEnum = {
  primarykey: 'primarykey',
  taskId: 'taskId',
  file: 'file',
  uploadedBy: 'uploadedBy',
  uploadedAt: 'uploadedAt'
};

exports.Prisma.TagScalarFieldEnum = {
  primarykey: 'primarykey',
  name: 'name',
  color: 'color'
};

exports.Prisma.TaskTagScalarFieldEnum = {
  primarykey: 'primarykey',
  task: 'task',
  tag: 'tag'
};

exports.Prisma.UserSettingsScalarFieldEnum = {
  primarykey: 'primarykey',
  account: 'account',
  theme: 'theme',
  language: 'language',
  isNotifications: 'isNotifications'
};

exports.Prisma.FileScalarFieldEnum = {
  primarykey: 'primarykey',
  value: 'value',
  type: 'type',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ChatScalarFieldEnum = {
  primarykey: 'primarykey',
  title: 'title',
  description: 'description',
  photo: 'photo',
  account: 'account'
};

exports.Prisma.ChatMemberScalarFieldEnum = {
  primarykey: 'primarykey',
  chatId: 'chatId',
  account: 'account'
};

exports.Prisma.ChatMessageScalarFieldEnum = {
  primarykey: 'primarykey',
  chatId: 'chatId',
  account: 'account',
  content: 'content',
  isEdited: 'isEdited',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReadMessageScalarFieldEnum = {
  message: 'message',
  account: 'account',
  isRead: 'isRead'
};

exports.Prisma.AppLogScalarFieldEnum = {
  primarykey: 'primarykey',
  category: 'category',
  priority: 'priority',
  timestamp: 'timestamp',
  machineName: 'machineName',
  appDomainName: 'appDomainName',
  processId: 'processId',
  message: 'message'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  Account: 'Account',
  Role: 'Role',
  Team: 'Team',
  TeamMember: 'TeamMember',
  Project: 'Project',
  Task: 'Task',
  TaskComment: 'TaskComment',
  TaskAttachment: 'TaskAttachment',
  Tag: 'Tag',
  TaskTag: 'TaskTag',
  UserSettings: 'UserSettings',
  File: 'File',
  Chat: 'Chat',
  ChatMember: 'ChatMember',
  ChatMessage: 'ChatMessage',
  ReadMessage: 'ReadMessage',
  AppLog: 'AppLog'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
