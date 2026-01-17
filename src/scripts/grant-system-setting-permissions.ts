import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const pool = new Pool({ connectionString })

async function grantPermissions() {
  try {
    console.log('Attempting to grant permissions on SystemSetting table...')
    
    // Try to grant SELECT, INSERT, UPDATE permissions
    await pool.query(`
      GRANT SELECT, INSERT, UPDATE, DELETE ON "SystemSetting" TO CURRENT_USER
    `)
    
    console.log('✓ Permissions granted successfully!')
    
    // Test if we can now query the table
    try {
      const result = await pool.query('SELECT COUNT(*) FROM "SystemSetting"')
      console.log(`✓ Can now query table (${result.rows[0].count} rows)`)
    } catch (error: any) {
      console.log(`✗ Still cannot query table: ${error.message}`)
    }
    
  } catch (error: any) {
    console.error('Error granting permissions:', error.message)
    console.error('Error code:', error.code)
    console.error('\nThis likely means you need database admin privileges.')
    console.error('Please ask your database administrator to run:')
    console.error('  GRANT SELECT, INSERT, UPDATE, DELETE ON "SystemSetting" TO <your_user>;')
  } finally {
    await pool.end()
  }
}

grantPermissions()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })

