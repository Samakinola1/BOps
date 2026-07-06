import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding development database...');

  // 1. Clean existing records to avoid unique constraints
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();

  // 2. Create Demo Business
  const business = await prisma.business.create({
    data: {
      name: 'Acme Analytics & Tech',
      currency: 'USD',
      invoicePrefix: 'INV-',
      invoicePadding: 4,
      nextInvoiceNumber: 7,
      address: '100 Innovation Way, Suite 400, San Francisco, CA 94105',
      taxNumber: 'US-987654321',
    },
  });

  // Seed default categories
  const categoriesList = [
    'Rent & Lease',
    'Utilities (Electricity, Water, Internet, Phone)',
    'Salaries & Wages',
    'Marketing & Advertising',
    'Travel & Lodging',
    'Office Supplies',
    'Software & Subscriptions',
    'Fuel & Vehicle',
    'Inventory / Cost of Goods Sold (COGS)',
    'Equipment & Maintenance',
    'Professional Services (Legal, Accounting, Consulting)',
    'Insurance',
    'Bank Fees & Charges',
    'Taxes & Licenses',
    'Other / Miscellaneous'
  ];

  const categories = await Promise.all(
    categoriesList.map(name => 
      prisma.expenseCategory.create({
        data: {
          name,
          businessId: business.id,
        }
      })
    )
  );

  const getCategoryId = (name: string) => {
    const cat = categories.find(c => c.name.startsWith(name) || name.startsWith(c.name));
    return cat ? cat.id : categories[categories.length - 1].id;
  };

  // 3. Create Demo User (Password: demo1234)
  const passwordHash = bcrypt.hashSync('demo1234', 10);
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      passwordHash,
      name: 'John Demo Admin',
      role: 'ADMIN',
      emailVerified: true,
      businessId: business.id,
    },
  });

  // 4. Create Customers
  const customerBruce = await prisma.customer.create({
    data: {
      name: 'Bruce Wayne',
      businessName: 'Wayne Enterprises',
      email: 'bruce@waynecorp.com',
      phone: '+1 (555) 193-9000',
      address: '1007 Mountain Drive, Gotham City, NJ 07001',
      notes: 'VIP Client. High volume accounts. Contact Alfred for billing.',
      businessId: business.id,
    },
  });

  const customerSarah = await prisma.customer.create({
    data: {
      name: 'Sarah Connor',
      businessName: 'Cyberdyne Resistance',
      email: 'sarah@cyberdyne.net',
      phone: '+1 (555) 198-4000',
      address: '742 Evergreen Terr, Los Angeles, CA 90024',
      notes: 'Prefers electronic delivery. Frequently on travel.',
      businessId: business.id,
    },
  });

  const customerJohn = await prisma.customer.create({
    data: {
      name: 'John Doe',
      businessName: 'JD Consulting',
      email: 'john@jdconsulting.com',
      phone: '+1 (555) 555-0199',
      address: '123 Main St, Boston, MA 02108',
      notes: 'Net 30 terms strictly enforced.',
      businessId: business.id,
    },
  });

  // 5. Create Invoices
  // Invoice 1: Paid Invoice for Bruce Wayne
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-0001',
      issueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      status: 'Paid',
      taxRate: 5.0,
      taxAmount: 250.0,
      discountRate: 0.0,
      discountAmount: 0.0,
      totalAmount: 5250.0,
      notes: 'Thank you for your business.',
      businessId: business.id,
      customerId: customerBruce.id,
    },
  });

  // Invoice 2: Partially Paid Invoice for Bruce Wayne
  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-0002',
      issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
      status: 'Partially Paid',
      taxRate: 5.0,
      taxAmount: 400.0,
      discountRate: 10.0,
      discountAmount: 800.0,
      totalAmount: 7600.0,
      notes: '10% Wayne group discount applied.',
      businessId: business.id,
      customerId: customerBruce.id,
    },
  });

  // Invoice 3: Draft Invoice for Bruce Wayne
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-0003',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'Draft',
      taxRate: 0.0,
      taxAmount: 0.0,
      discountAmount: 0.0,
      totalAmount: 12000.0,
      notes: 'Pending review.',
      businessId: business.id,
      customerId: customerBruce.id,
    },
  });

  // Invoice 4: Paid Invoice for Sarah Connor
  const inv4 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-0004',
      issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      status: 'Paid',
      taxRate: 0.0,
      taxAmount: 0.0,
      discountAmount: 0.0,
      totalAmount: 1500.0,
      businessId: business.id,
      customerId: customerSarah.id,
    },
  });

  // Invoice 5: Sent/Unpaid Invoice for Sarah Connor
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-0005',
      issueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
      status: 'Sent',
      taxRate: 8.25,
      taxAmount: 198.0,
      totalAmount: 2598.0,
      notes: 'Server architecture consultancy.',
      businessId: business.id,
      customerId: customerSarah.id,
    },
  });

  // Invoice 6: Overdue Invoice for John Doe
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-0006',
      issueDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
      dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      status: 'Overdue',
      taxRate: 0.0,
      taxAmount: 0.0,
      totalAmount: 3200.0,
      notes: 'First notice sent.',
      businessId: business.id,
      customerId: customerJohn.id,
    },
  });

  // 6. Create Payments
  // Payment for Invoice 1 (Full)
  await prisma.payment.create({
    data: {
      amount: 5250.0,
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      method: 'Bank Transfer',
      notes: 'Wire transfer ref #998877',
      invoiceId: inv1.id,
    },
  });

  // Payment for Invoice 2 (Partial)
  await prisma.payment.create({
    data: {
      amount: 3000.0,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      method: 'Bank Transfer',
      notes: 'Partial invoice payment ref #223311',
      invoiceId: inv2.id,
    },
  });

  // Payment for Invoice 4 (Full)
  await prisma.payment.create({
    data: {
      amount: 1500.0,
      date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), // 28 days ago
      method: 'Cash',
      notes: 'Paid in cash.',
      invoiceId: inv4.id,
    },
  });

  // 7. Seed some sample expenses
  await prisma.expense.createMany({
    data: [
      {
        amount: 1200.0,
        vendor: 'AWS Cloud',
        categoryId: getCategoryId('Utilities'),
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        notes: 'Monthly server hosting fee',
        businessId: business.id,
      },
      {
        amount: 350.0,
        vendor: 'Office Depot',
        categoryId: getCategoryId('Office Supplies'),
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        notes: 'Stationery and desk accessories',
        businessId: business.id,
      },
    ],
  });

  console.log('Seeding successfully completed!');
  console.log(`Demo Account Credentials:`);
  console.log(`Email:    demo@example.com`);
  console.log(`Password: demo1234`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
