import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const pool = new Pool({ connectionString })

async function checkSystemSettingTable() {
  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'SystemSetting'
      )
    `)
    
    const tableExists = tableCheck.rows[0].exists
    
    if (tableExists) {
      console.log('✓ SystemSetting table exists')
      
      // Check table structure
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'SystemSetting'
        ORDER BY ordinal_position
      `)
      
      console.log('\nTable structure:')
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
      })
      
      // Check if we can read from it
      try {
        const testRead = await pool.query('SELECT COUNT(*) FROM "SystemSetting"')
        console.log(`\n✓ Can read from table (${testRead.rows[0].count} rows)`)
      } catch (error: any) {
        console.log(`\n✗ Cannot read from table: ${error.message}`)
      }
      
      // Check if we can write to it
      try {
        const testWrite = await pool.query(`
          INSERT INTO "SystemSetting" ("id", "key", "value", "createdAt", "updatedAt")
          VALUES ('test-' || gen_random_uuid()::text, 'TEST_KEY', 'test', NOW(), NOW())
          ON CONFLICT ("key") DO UPDATE SET "value" = 'test', "updatedAt" = NOW()
        `)
        console.log('✓ Can write to table')
        
        // Clean up test row
        await pool.query(`DELETE FROM "SystemSetting" WHERE "key" = 'TEST_KEY'`)
      } catch (error: any) {
        console.log(`\n✗ Cannot write to table: ${error.message}`)
        console.log(`  Error code: ${error.code}`)
      }
      
    } else {
      console.log('✗ SystemSetting table does NOT exist')
    }
    
  } catch (error: any) {
    console.error('Error checking SystemSetting table:', error.message)
    console.error('Error code:', error.code)
  } finally {
    await pool.end()
  }
}

checkSystemSettingTable()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })

