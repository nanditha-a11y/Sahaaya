import {
  ApplicationStatus,
  AttendanceStatus,
  MovementType,
  PaymentStatus,
  PrismaClient,
  UserRole,
} from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

const DEMO_PHOTOS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=60',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=60',
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&q=60',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=60',
]

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

async function main() {
  faker.seed(2026)

  console.log('Cleaning previous demo records...')
  await prisma.auditLog.deleteMany()
  await prisma.document.deleteMany({ where: { isDemo: true } })
  await prisma.message.deleteMany({ where: { isDemo: true } })
  await prisma.mentorshipSession.deleteMany({ where: { isDemo: true } })
  await prisma.mentor.deleteMany({ where: { isDemo: true } })
  await prisma.scholarshipApplication.deleteMany({ where: { isDemo: true } })
  await prisma.scholarship.deleteMany({ where: { isDemo: true } })
  await prisma.stockMovement.deleteMany({ where: { isDemo: true } })
  await prisma.resource.deleteMany({ where: { isDemo: true } })
  await prisma.donation.deleteMany({ where: { isDemo: true } })
  await prisma.campaign.deleteMany({ where: { isDemo: true } })
  await prisma.donor.deleteMany({ where: { isDemo: true } })
  await prisma.healthRecord.deleteMany({ where: { isDemo: true } })
  await prisma.attendance.deleteMany({ where: { isDemo: true } })
  await prisma.educationRecord.deleteMany({ where: { isDemo: true } })
  await prisma.child.deleteMany({ where: { isDemo: true } })
  await prisma.user.deleteMany({ where: { isDemo: true } })
  await prisma.organization.deleteMany({ where: { isDemo: true } })

  // 1. Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Sahaaya Child Welfare Foundation (Demo)',
      city: 'Bengaluru',
      state: 'Karnataka',
      address: '42 Heritage Lane, Indiranagar, Bengaluru',
      phone: '+91-80-4000-1234',
      email: 'contact@sahaaya-demo.org',
      isDemo: true,
    },
  })

  // 2. Users: 1 Super Admin, 15 Staff, 8 Educators, 4 Healthcare Staff
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@sahaaya-demo.org',
      name: 'Ananya Deshmukh',
      role: UserRole.SUPER_ADMIN,
      phone: faker.phone.number(),
      organizationId: org.id,
      isDemo: true,
    },
  })

  await prisma.user.createMany({
    data: [
      ...Array.from({ length: 15 }, (_, i) => ({
        email: `staff${i + 1}@sahaaya-demo.org`,
        name: faker.person.fullName(),
        role: UserRole.STAFF,
        phone: faker.phone.number(),
        organizationId: org.id,
        isDemo: true,
      })),
      ...Array.from({ length: 8 }, (_, i) => ({
        email: `educator${i + 1}@sahaaya-demo.org`,
        name: faker.person.fullName(),
        role: UserRole.EDUCATOR,
        phone: faker.phone.number(),
        organizationId: org.id,
        isDemo: true,
      })),
      ...Array.from({ length: 4 }, (_, i) => ({
        email: `health${i + 1}@sahaaya-demo.org`,
        name: `Dr. ${faker.person.fullName()}`,
        role: UserRole.HEALTHCARE_STAFF,
        phone: faker.phone.number(),
        organizationId: org.id,
        isDemo: true,
      })),
    ],
  })

  const staffUsers = await prisma.user.findMany({
    where: { organizationId: org.id, role: UserRole.STAFF },
  })
  const educatorUsers = await prisma.user.findMany({
    where: { organizationId: org.id, role: UserRole.EDUCATOR },
  })
  const healthcareUsers = await prisma.user.findMany({
    where: { organizationId: org.id, role: UserRole.HEALTHCARE_STAFF },
  })

  // 3. Children (100) + Student User accounts for older children
  const childDrafts = Array.from({ length: 100 }, (_, i) => {
    const age = i === 0 ? 10 : faker.number.int({ min: 4, max: 17 })
    const grade = Math.max(1, age - 5)
    return {
      index: i,
      age,
      grade,
      name: i === 0 ? 'Meera' : faker.person.firstName(),
      hasStudentLogin: age >= 12 && i < 20,
    }
  })

  const studentDrafts = childDrafts.filter((c) => c.hasStudentLogin)
  if (studentDrafts.length > 0) {
    await prisma.user.createMany({
      data: studentDrafts.map((c) => ({
        email: `student${c.index + 1}@sahaaya-demo.org`,
        name: c.name,
        role: UserRole.STUDENT,
        organizationId: org.id,
        isDemo: true,
      })),
    })
  }

  const studentUsers = await prisma.user.findMany({
    where: { organizationId: org.id, role: UserRole.STUDENT },
  })
  const studentByEmail = new Map(studentUsers.map((u) => [u.email, u.id]))

  await prisma.child.createMany({
    data: childDrafts.map((c) => ({
      code: `SHY-${String(c.index + 1).padStart(3, '0')}`,
      name: c.name,
      age: c.age,
      dateOfBirth: new Date(new Date().getFullYear() - c.age, c.index % 12, (c.index % 28) + 1),
      gender: faker.helpers.arrayElement(['Female', 'Male']),
      admissionDate: faker.date.past({ years: 5 }),
      educationSummary: `Grade ${c.grade}`,
      healthSummary: faker.helpers.weightedArrayElement([
        { weight: 8, value: 'Good' },
        { weight: 2, value: 'Fair' },
      ]),
      photo: faker.helpers.arrayElement(DEMO_PHOTOS),
      bio: faker.lorem.sentence(),
      organizationId: org.id,
      assignedStaffId: faker.helpers.arrayElement(staffUsers).id,
      studentUserId: c.hasStudentLogin
        ? studentByEmail.get(`student${c.index + 1}@sahaaya-demo.org`)
        : undefined,
      isDemo: true,
    })),
  })

  const children = await prisma.child.findMany({
    where: { organizationId: org.id, isDemo: true },
    orderBy: { code: 'asc' },
  })

  // 4. Education Records (250) & Attendance (1,500 in 3 chunks of 500)
  await prisma.educationRecord.createMany({
    data: Array.from({ length: 250 }, (_, i) => {
      const child = children[i % children.length]
      return {
        childId: child.id,
        educatorId: faker.helpers.arrayElement(educatorUsers).id,
        schoolName: faker.helpers.arrayElement([
          'Sahaaya Vidya Mandir',
          'Hope Public School',
          'Sunrise High School',
        ]),
        grade: child.educationSummary,
        academicYear: faker.helpers.arrayElement(['2024-2025', '2025-2026']),
        term: faker.helpers.arrayElement(['Term 1', 'Term 2', 'Final']),
        gpaOrScore: Number(faker.number.int({ min: 620, max: 980 }) / 10),
        notes: faker.lorem.sentence(),
        isDemo: true,
      }
    }),
  })

  const educationRecords = await prisma.educationRecord.findMany({
    where: { isDemo: true },
  })

  const attendanceRows = Array.from({ length: 1500 }, (_, i) => {
    const edu = educationRecords[i % educationRecords.length]
    return {
      childId: edu.childId,
      educationRecordId: edu.id,
      date: faker.date.recent({ days: 180 }),
      status: faker.helpers.weightedArrayElement([
        { weight: 85, value: AttendanceStatus.PRESENT },
        { weight: 8, value: AttendanceStatus.LATE },
        { weight: 4, value: AttendanceStatus.EXCUSED },
        { weight: 3, value: AttendanceStatus.ABSENT },
      ]),
      remarks: null,
      isDemo: true,
    }
  })

  for (const batch of chunkArray(attendanceRows, 500)) {
    await prisma.attendance.createMany({ data: batch })
  }

  // 5. Health Records (100)
  await prisma.healthRecord.createMany({
    data: Array.from({ length: 100 }, (_, i) => {
      const child = children[i % children.length]
      return {
        childId: child.id,
        healthcareStaffId: faker.helpers.arrayElement(healthcareUsers).id,
        checkupDate: faker.date.recent({ days: 365 }),
        heightCm: Number(faker.number.int({ min: 950, max: 1720 }) / 10),
        weightKg: Number(faker.number.int({ min: 150, max: 650 }) / 10),
        immunizationNotes: 'Routine immunizations verified (Synthetic Record)',
        diagnosisOrNotes: faker.helpers.arrayElement([
          'Annual wellness checkup — normal growth',
          'Vision screening completed — clear',
          'Dental hygiene checkup — good',
          'Nutritional supplement follow-up',
        ]),
        followUpDate: faker.date.soon({ days: 90 }),
        isDemo: true,
      }
    }),
  })

  // 6. Donors (30), Campaigns (4) & Donations (150)
  await prisma.campaign.createMany({
    data: [
      { title: 'STEM & Digital Classrooms', targetAmount: 500000 },
      { title: 'Annual Nutrition & Wellness Drive', targetAmount: 350000 },
      { title: 'Higher Education Scholarship Fund', targetAmount: 600000 },
      { title: 'Library & Creative Arts Studio', targetAmount: 200000 },
    ].map((c) => ({
      organizationId: org.id,
      title: c.title,
      description: faker.lorem.sentence(),
      targetAmount: c.targetAmount,
      raisedAmount: 0,
      isDemo: true,
    })),
  })

  const campaigns = await prisma.campaign.findMany({
    where: { organizationId: org.id, isDemo: true },
  })

  const donorDrafts = Array.from({ length: 30 }, (_, i) => ({
    index: i,
    email: `donor${i + 1}@sahaaya-demo.org`,
    name: faker.person.fullName(),
    phone: faker.phone.number(),
    city: faker.helpers.arrayElement(['Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Pune']),
  }))

  await prisma.user.createMany({
    data: donorDrafts.slice(0, 10).map((d) => ({
      email: d.email,
      name: d.name,
      role: UserRole.DONOR,
      organizationId: org.id,
      isDemo: true,
    })),
  })

  const donorUsers = await prisma.user.findMany({
    where: { organizationId: org.id, role: UserRole.DONOR },
  })
  const donorUserByEmail = new Map(donorUsers.map((u) => [u.email, u.id]))

  await prisma.donor.createMany({
    data: donorDrafts.map((d) => ({
      userId: donorUserByEmail.get(d.email),
      name: d.name,
      email: d.email,
      phone: d.phone,
      city: d.city,
      isRecurring: d.index % 3 === 0,
      isAnonymous: d.index % 7 === 0,
      isDemo: true,
    })),
  })

  const donors = await prisma.donor.findMany({ where: { isDemo: true } })

  await prisma.donation.createMany({
    data: Array.from({ length: 150 }, (_, i) => ({
      donorId: donors[i % donors.length].id,
      organizationId: org.id,
      campaignId: faker.helpers.arrayElement(campaigns).id,
      amount: faker.helpers.arrayElement([1000, 2500, 5000, 10000, 25000]),
      currency: 'INR',
      status: PaymentStatus.COMPLETED,
      paymentRef: `DEMO-PAY-${String(i + 1).padStart(4, '0')}`,
      donatedAt: faker.date.recent({ days: 365 }),
      isDemo: true,
    })),
  })

  // 7. Resources (25) & Stock Movements (100)
  const resourceNames = [
    'Mathematics Textbooks', 'Science Workbooks', 'Student Laptops', 'School Uniforms',
    'Winter Sweaters', 'First-Aid Kits', 'Vitamin Supplements', 'Drawing & Art Kits',
    'Notebooks (Pack of 10)', 'School Backpacks', 'Sports Shoes', 'Footballs',
    'Storybooks & Novels', 'Study Desks', 'Water Bottles', 'Hygiene Kits',
    'Geometry Boxes', 'Reading Lamps', 'Tablets for E-Learning', 'Whiteboard Markers',
    'Cricket Sets', 'Chess Boards', 'Raincoats', 'Sanitizers', 'Blankets',
  ]

  await prisma.resource.createMany({
    data: resourceNames.map((name, i) => ({
      organizationId: org.id,
      name,
      category: i % 3 === 0 ? 'Education' : i % 3 === 1 ? 'Health' : 'Essentials',
      unit: 'units',
      stock: faker.number.int({ min: 8, max: 150 }),
      lowThreshold: 15,
      isDemo: true,
    })),
  })

  const resources = await prisma.resource.findMany({
    where: { organizationId: org.id, isDemo: true },
  })

  await prisma.stockMovement.createMany({
    data: Array.from({ length: 100 }, (_, i) => ({
      resourceId: resources[i % resources.length].id,
      performedById: faker.helpers.arrayElement(staffUsers).id,
      type: i % 2 === 0 ? MovementType.INCOMING : MovementType.OUTGOING,
      quantity: faker.number.int({ min: 2, max: 25 }),
      reason: i % 2 === 0 ? 'Supplier delivery restock' : 'Distributed to students',
      createdAt: faker.date.recent({ days: 120 }),
      isDemo: true,
    })),
  })

  // 8. Scholarships (20) & Applications (60)
  await prisma.scholarship.createMany({
    data: Array.from({ length: 20 }, (_, i) => ({
      organizationId: org.id,
      title: `${faker.helpers.arrayElement(['Merit', 'STEM', 'Creative Arts', 'Sports', 'Leadership'])} Grant #${i + 1}`,
      provider: faker.company.name(),
      amount: faker.helpers.arrayElement([15000, 25000, 40000, 50000]),
      eligibility: 'Minimum 70% attendance and academic progression',
      deadline: faker.date.soon({ days: 120 }),
      isDemo: true,
    })),
  })

  const scholarships = await prisma.scholarship.findMany({
    where: { organizationId: org.id, isDemo: true },
  })

  await prisma.scholarshipApplication.createMany({
    data: Array.from({ length: 60 }, (_, i) => ({
      scholarshipId: scholarships[i % scholarships.length].id,
      childId: children[(i * 2) % children.length].id,
      status: faker.helpers.arrayElement([
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.UNDER_REVIEW,
        ApplicationStatus.APPROVED,
      ]),
      statement: faker.lorem.paragraph(),
      appliedAt: faker.date.recent({ days: 60 }),
      isDemo: true,
    })),
  })

  // 9. Mentors (15) & Mentorship Sessions (80)
  await prisma.mentor.createMany({
    data: Array.from({ length: 15 }, () => ({
      organizationId: org.id,
      name: faker.person.fullName(),
      specialty: faker.helpers.arrayElement([
        'Software Engineering', 'Medicine', 'Fine Arts', 'Mathematics', 'Entrepreneurship',
      ]),
      bio: faker.lorem.sentence(),
      city: faker.helpers.arrayElement(['Bengaluru', 'Mumbai', 'Pune', 'Hyderabad']),
      isDemo: true,
    })),
  })

  const mentors = await prisma.mentor.findMany({
    where: { organizationId: org.id, isDemo: true },
  })

  await prisma.mentorshipSession.createMany({
    data: Array.from({ length: 80 }, (_, i) => ({
      mentorId: mentors[i % mentors.length].id,
      childId: children[i % children.length].id,
      topic: faker.helpers.arrayElement([
        'Career Guidance', 'Study Habits', 'Science Project Prep', 'Public Speaking',
      ]),
      sessionDate: faker.date.recent({ days: 90 }),
      durationMin: faker.helpers.arrayElement([30, 45, 60]),
      notes: faker.lorem.sentence(),
      isDemo: true,
    })),
  })

  // 10. Messages (100)
  await prisma.message.createMany({
    data: Array.from({ length: 100 }, (_, i) => ({
      senderId: i % 2 === 0 ? faker.helpers.arrayElement(staffUsers).id : null,
      fromName: faker.person.fullName(),
      fromRole: faker.helpers.arrayElement(['Donor', 'Alumnus', 'Mentor', 'Volunteer']),
      text: faker.lorem.sentence(),
      isPublicWall: true,
      createdAt: faker.date.recent({ days: 180 }),
      isDemo: true,
    })),
  })

  // Audit Log entry for seed verification
  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      actorId: superAdmin.id,
      action: 'SEED_DEMO_DATABASE',
      entityType: 'Organization',
      entityId: org.id,
      metadata: { children: 100, donations: 150, attendances: 1500 },
    },
  })

  console.log('Seed completed successfully.')
}

main()
  .catch((error) => {
    console.error('Database seed failed:', error)
    throw error
  })
  .finally(async () => {
    await prisma.$disconnect()
  })