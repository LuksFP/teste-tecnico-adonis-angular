import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  /**
   * Default connection used for all queries.
   */
  connection: 'sqlite',

  connections: {
    /**
     * SQLite connection (default).
     */
    sqlite: {
      client: 'better-sqlite3',

      connection: {
        filename: app.tmpPath(env.get('DB_FILE', 'db.sqlite3')),
      },

      /**
       * Required by Knex for SQLite defaults.
       */
      useNullAsDefault: true,

      /**
       * SQLite ships with foreign keys disabled. Turning them on per
       * connection makes the database enforce the relationships too.
       */
      pool: {
        afterCreate: (connection: { pragma: (sql: string) => unknown }, done: () => void) => {
          connection.pragma('foreign_keys = ON')
          done()
        },
      },

      migrations: {
        /**
         * Sort migration files naturally by filename.
         */
        naturalSort: true,

        /**
         * Paths containing migration files.
         */
        paths: ['database/migrations'],
      },

      /**
       * Models declare their columns explicitly, so the generated
       * schema classes are not used.
       */
      schemaGeneration: {
        enabled: false,
      },
    },
  },
})

export default dbConfig
