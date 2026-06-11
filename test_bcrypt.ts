import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: "superadmin@admin.com" }
    });

    if (!user) {
        console.log("User not found!");
        return;
    }

    console.log("Hash in DB:", user.passwordHash);
    const isValid = await bcrypt.compare("password123", user.passwordHash);
    console.log("Is Valid?", isValid);
}

main().finally(() => prisma.$disconnect());
