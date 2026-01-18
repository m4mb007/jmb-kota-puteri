import { PrismaClient, Role, UnitType, ParkingType, FundType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

dotenv.config()

const connectionString = process.env.DATABASE_URL

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Start seeding ...')

  // 1. Create Super Admin
  const adminEmail = 'admin@strata.com'
  const hashedPassword = await bcrypt.hash('admin123', 10) // Password: admin123
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      phone: '0123456789', // Add default phone for admin
    },
    create: {
      email: adminEmail,
      name: 'Super Admin',
      password: hashedPassword, 
      role: Role.SUPER_ADMIN,
      phone: '0123456789', // Add default phone for admin
    },
  })
  console.log(`Created user: ${admin.name} (${admin.role})`)

  // 2. Create Example Lot (J-13)
  const lotNumber = 'J-13'
  const lot = await prisma.lot.upsert({
    where: { lotNumber },
    update: {},
    create: {
      lotNumber,
    },
  })
  console.log(`Created Lot: ${lot.lotNumber}`)

  // 3. Create Units (J-13-1 Bawah, J-13-2 Atas)
  const unitsData = [
    { number: 'J-13-1', type: UnitType.BAWAH },
    { number: 'J-13-2', type: UnitType.ATAS },
  ]

  for (const u of unitsData) {
    const unit = await prisma.unit.upsert({
      where: { unitNumber: u.number },
      update: {},
      create: {
        unitNumber: u.number,
        type: u.type,
        lotId: lot.id,
      },
    })
    console.log(`Created Unit: ${unit.unitNumber} (${unit.type})`)

    // 4. Create Accessory Parking for each unit (2 per unit)
    // Naming convention assumption: P-{UnitNumber}-1, P-{UnitNumber}-2
    const parkingNumbers = [`P-${u.number}-1`, `P-${u.number}-2`]
    for (const pNum of parkingNumbers) {
      await prisma.parking.upsert({
        where: { number: pNum },
        update: {},
        create: {
          number: pNum,
          type: ParkingType.ACCESSORY,
          unitId: unit.id,
        },
      })
    }
    console.log(`Created Parkings for ${unit.unitNumber}: ${parkingNumbers.join(', ')}`)
  }

  // 5. Create some Common Parking
  const commonParkings = ['CP-01', 'CP-02', 'CP-03']
  for (const cp of commonParkings) {
    await prisma.parking.upsert({
      where: { number: cp },
      update: {},
      create: {
        number: cp,
        type: ParkingType.COMMON,
      },
    })
  }
  console.log(`Created Common Parkings: ${commonParkings.join(', ')}`)

  // 6. Seed Funds
  const funds = [
    { code: FundType.MAINTENANCE, name: 'Maintenance Fund' },
    { code: FundType.SINKING, name: 'Sinking Fund' },
  ]

  for (const f of funds) {
    await prisma.fund.upsert({
      where: { code: f.code },
      update: {},
      create: {
        code: f.code,
        name: f.name,
      },
    })
  }
  console.log('Seeded Funds')

  // 7. Seed Expense Categories
  const categories = [
    'TNB', 'AIR', 'TELEFON / INTERNET', 'INDAH WATER', 
    'PENGURUSAN', 'PENYELENGGARAAN', 'INSURANS', 'LAIN-LAIN'
  ]

  for (const c of categories) {
    await prisma.expenseCategory.upsert({
      where: { name: c },
      update: {},
      create: { name: c },
    })
  }
  console.log('Seeded Expense Categories')

  // 8. Seed System Settings for Billing
  const systemSettings = [
    { key: 'BASE_MONTHLY_BILL_ATAS', value: '95' },   // Upper level units
    { key: 'BASE_MONTHLY_BILL_BAWAH', value: '88' },  // Lower level units
  ]

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: {
        key: setting.key,
        value: setting.value,
      },
    })
  }
  console.log('Seeded System Settings for different unit types')

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
