import { init, i } from '@instantdb/react';

// Define the schema
const schema = i.schema({
  entities: {
    // Global pool of tasks/actions
    tasks: i.entity({
      title: i.string(),
      description: i.string(),
      imageUrl: i.string().optional(),
      externalLink: i.string().optional(),
      createdAt: i.number(),
      eventDate: i.string().optional(),
      eventTime: i.string().optional(),
      eventLocation: i.string().optional(),
    }),

    // User executions of tasks (many-to-many junction)
    executions: i.entity({
      executedAt: i.number(),
      completed: i.boolean(),
      completedAt: i.number().optional(),
    }),

    // Extended user profile data
    profiles: i.entity({
      name: i.string(),
      profileImage: i.string().optional(),
      profileImageThumb: i.string().optional(),
      avatarColor: i.string().optional(),
      dailyStreak: i.number(),
      lastCompletionDate: i.number().optional(),
    }),

    // Comments on tasks
    comments: i.entity({
      text: i.string(),
      createdAt: i.number(),
      mentionedUser: i.string().optional(), // @username for reply-to-reply
    }),

    // Friend relationships (directional edges)
    relationships: i.entity({
      status: i.string(), // 'pending' | 'accepted'
      createdAt: i.number(),
      acceptedAt: i.number().optional(),
    }),

    // Challenge invites between friends for existing tasks
    challengeInvites: i.entity({
      message: i.string().optional(),
      status: i.string(), // 'pending' | 'accepted' | 'declined' | 'completed'
      createdAt: i.number(),
      respondedAt: i.number().optional(),
      completedAt: i.number().optional(),
    }),
  },
  links: {
    // Task creator relationship (one-to-many)
    taskCreator: {
      forward: {
        on: 'tasks',
        has: 'one',
        label: 'creator',
      },
      reverse: {
        on: 'profiles',
        has: 'many',
        label: 'createdTasks',
      },
    },

    // Task executions relationship (many-to-many through executions)
    taskExecutions: {
      forward: {
        on: 'tasks',
        has: 'many',
        label: 'executions',
      },
      reverse: {
        on: 'executions',
        has: 'one',
        label: 'task',
      },
    },

    // User executions relationship (many-to-many through executions)
    userExecutions: {
      forward: {
        on: 'profiles',
        has: 'many',
        label: 'executions',
      },
      reverse: {
        on: 'executions',
        has: 'one',
        label: 'user',
      },
    },

    // Task comments relationship (one-to-many)
    taskComments: {
      forward: {
        on: 'tasks',
        has: 'many',
        label: 'comments',
      },
      reverse: {
        on: 'comments',
        has: 'one',
        label: 'task',
      },
    },

    // User comments relationship (one-to-many)
    userComments: {
      forward: {
        on: 'profiles',
        has: 'many',
        label: 'comments',
      },
      reverse: {
        on: 'comments',
        has: 'one',
        label: 'author',
      },
    },

    // Comment replies relationship (self-referential one-to-many)
    commentReplies: {
      forward: {
        on: 'comments',
        has: 'many',
        label: 'replies',
      },
      reverse: {
        on: 'comments',
        has: 'one',
        label: 'parentComment',
      },
    },

    // Relationship from user (who sent the request)
    relationshipFromUser: {
      forward: {
        on: 'relationships',
        has: 'one',
        label: 'fromUser',
      },
      reverse: {
        on: 'profiles',
        has: 'many',
        label: 'outgoingRelationships',
      },
    },

    // Relationship to user (who received the request)
    relationshipToUser: {
      forward: {
        on: 'relationships',
        has: 'one',
        label: 'toUser',
      },
      reverse: {
        on: 'profiles',
        has: 'many',
        label: 'incomingRelationships',
      },
    },

    // Challenge invite sender
    challengeFromUser: {
      forward: {
        on: 'challengeInvites',
        has: 'one',
        label: 'fromUser',
      },
      reverse: {
        on: 'profiles',
        has: 'many',
        label: 'sentChallenges',
      },
    },

    // Challenge invite recipient
    challengeToUser: {
      forward: {
        on: 'challengeInvites',
        has: 'one',
        label: 'toUser',
      },
      reverse: {
        on: 'profiles',
        has: 'many',
        label: 'receivedChallenges',
      },
    },

    // Challenge invite linked task
    challengeTask: {
      forward: {
        on: 'challengeInvites',
        has: 'one',
        label: 'task',
      },
      reverse: {
        on: 'tasks',
        has: 'many',
        label: 'challengeInvites',
      },
    },

    // Challenge invite linked execution (created on accept)
    challengeExecution: {
      forward: {
        on: 'challengeInvites',
        has: 'one',
        label: 'execution',
      },
      reverse: {
        on: 'executions',
        has: 'one',
        label: 'challengeInvite',
      },
    },
  },
});

// Initialize InstantDB with your app ID
const APP_ID = '40399ce9-086c-4b06-bc54-6cc8d053efc4';

const db = init({
  appId: APP_ID,
  schema,
});

export default db;
export { schema };
