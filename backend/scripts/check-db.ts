import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

import bcrypt from "bcryptjs";

async function check() {
    const users = await prisma.user.findMany();
    console.log("Total users:", users.length);

    const admin = await prisma.user.findUnique({
        where: { email: "superadmin@admin.com" }
    });

    if (admin) {
        console.log("Superadmin found!");
        console.log("Email:", admin.email);
        console.log("PasswordHash:", admin.passwordHash);

        const isValid = await bcrypt.compare("password123", admin.passwordHash);
        console.log("Is password 'password123' valid for this hash?", isValid);
    } else {
        console.log("Superadmin NOT found!");
    }
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
