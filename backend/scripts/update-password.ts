import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function update() {
    const email = "superadmin@admin.com";
    const password = "password123";
    const hash = await bcrypt.hash(password, 10);

    console.log(`Updating password for ${email}...`);
    console.log(`New Hash: ${hash}`);

    const user = await prisma.user.update({
        where: { email },
        data: { passwordHash: hash }
    });

    console.log("Update successful!");

    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log("Verification - Is password 'password123' valid for the new hash?", isValid);
}

update()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
