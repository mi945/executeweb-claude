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
      dailyStreak: i.number(),
      lastCompletionDate: i.number().optional(),
    }),

    // Comments on tasks
    comments: i.entity({
      text: i.string(),
      createdAt: i.number(),
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
