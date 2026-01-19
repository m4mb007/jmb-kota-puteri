import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const pool = new Pool({ connectionString })

async function getDbUser() {
  try {
    // Get current user
    const userResult = await pool.query('SELECT current_user, session_user')
    console.log('Current database user:', userResult.rows[0].current_user)
    console.log('Session user:', userResult.rows[0].session_user)
    
    // Get SystemSetting table owner
    const ownerResult = await pool.query(`
      SELECT tableowner
      FROM pg_tables
      WHERE tablename = 'SystemSetting'
    `)
    
    if (ownerResult.rows.length > 0) {
      console.log('\nSystemSetting table owner:', ownerResult.rows[0].tableowner)
      console.log('\nTo fix permissions, run as the table owner or a superuser:')
      console.log(`  GRANT SELECT, INSERT, UPDATE, DELETE ON "SystemSetting" TO ${userResult.rows[0].current_user};`)
    } else {
      console.log('\nSystemSetting table not found in pg_tables')
    }
    
  } catch (err) {
    const error = err as { message: string };
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

getDbUser()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })

