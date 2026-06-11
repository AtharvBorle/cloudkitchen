import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const newPassword = '12345678';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    console.log(`Updating all user passwords to "${newPassword}"...`);

    const result = await prisma.user.updateMany({
        data: {
            passwordHash: passwordHash
        }
    });

    console.log(`Successfully updated ${result.count} users.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
