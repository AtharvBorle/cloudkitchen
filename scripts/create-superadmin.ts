let PrismaClient: any;
let bcrypt: any;

try {
  PrismaClient = require("@prisma/client").PrismaClient;
} catch {
  PrismaClient = require("../backend/node_modules/@prisma/client").PrismaClient;
}

try {
  bcrypt = require("bcryptjs");
} catch {
  bcrypt = require("../backend/node_modules/bcryptjs");
}

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "superadmin@admin.com";
  const password = process.argv[3] || "password123";
  const name = process.argv[4] || "Super Admin";
  const phone = process.argv[5] || "9999999999";

  console.log(`\n========================================================`);
  console.log(`👑 Creating / Updating Superadmin Account...`);
  console.log(`📧 Target Email: ${email}`);
  console.log(`========================================================\n`);

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "SUPERADMIN",
      isActive: true,
      name,
      phone,
      isPermanentlyDeleted: false,
      deletedAt: null,
    },
    create: {
      email,
      passwordHash,
      role: "SUPERADMIN",
      name,
      phone,
      city: "Pune",
      pincode: "411001",
      isActive: true,
    },
  });

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  console.log(`✅ Superadmin Ready!`);
  console.log(`   ID:       ${user.id}`);
  console.log(`   Name:     ${user.name}`);
  console.log(`   Email:    ${user.email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role:     ${user.role}`);
  console.log(`   Active:   ${user.isActive}`);
  console.log(`   Verified: ${isPasswordValid ? "YES" : "NO"}`);
  console.log(`\n🌐 Login at: https://neocloudbites.com/admin`);
  console.log(`   (Or https://neocloudbites.com/auth/login/admin)\n`);
}

main()
  .catch((e) => {
    console.error("❌ Error creating superadmin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
