import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { ApiError } from "@/lib/api-error";

export const getAdmins = async () => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SUPERADMIN") {
        throw new ApiError("Unauthorized", 401);
    }

    const admins = await db.user.findMany({
        where: { role: "AGENT" },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
        }
    });

    return { agents: admins };
};

export const createAdmin = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== "SUPERADMIN") {
        throw new ApiError("Unauthorized", 401);
    }

    const body = await req.json();
    const { name, email, phone, password } = body;

    if (!name || !email || !password) {
        throw new ApiError("Missing required fields", 400);
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new ApiError("User with this email already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newadmin = await db.$transaction(async (prisma) => {
        const user = await prisma.user.create({
            data: {
                name,
                email,
                phone: phone || "",
                passwordHash: hashedPassword,
                role: "AGENT",
                city: "System",
                pincode: "000000",
            }
        });

        await prisma.agentProfile.create({
            data: { userId: user.id }
        });

        return user;
    });

    return { agent: newadmin };
};
