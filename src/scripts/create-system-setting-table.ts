import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const pool = new Pool({ connectionString })

async function createSystemSettingTable() {
  try {
    console.log('Creating SystemSetting table...')
    
    // First check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'SystemSetting'
      )
    `)
    
    if (tableCheck.rows[0].exists) {
      console.log('Table already exists, skipping creation.')
      return
    }
    
    // Create table without IF NOT EXISTS to get clearer error messages
    await pool.query(`
      CREATE TABLE "SystemSetting" (
        "id" TEXT NOT NULL,
        "key" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
      )
    `)

    await pool.query(`
      CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key")
    `)

    console.log('SystemSetting table created successfully!')
  } catch (err) {
    const error = err as { message: string; code?: string };
    console.error('Error creating SystemSetting table:', error.message)
    console.error('Error code:', error.code)
    throw error
  } finally {
    await pool.end()
  }
}

createSystemSettingTable()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })

