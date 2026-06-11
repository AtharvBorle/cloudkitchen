import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const hashPassword = await bcrypt.hash("password123", 10);
    
    const emails = [
        "superadmin@admin.com",
        "agent@domain.com",
        "seller@domain.com",
        "pending_seller@domain.com",
        "customer@domain.com"
    ];

    for (const email of emails) {
        await prisma.user.updateMany({
            where: { email },
            data: { passwordHash: hashPassword }
        });
        console.log(`Updated password for ${email}`);
    }
}

main().finally(() => prisma.$disconnect());
