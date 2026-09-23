import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { ApiError } from "@/lib/api-error";

export const getAdmins = async () => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to view administrators.", 401);
    }
    if (session.user.role !== "SUPERADMIN") {
        throw new ApiError("Access denied. Superadmin privileges required.", 403);
    }

    const admins = await db.user.findMany({
        where: { role: { in: ["AGENT", "SUPPORT"] } },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            agentProfile: {
                select: {
                    canManageOffers: true,
                    canManageBanners: true
                }
            }
        }
    });

    return { agents: admins };
};

export const createAdmin = async (req: Request) => {
    const session = await getAuthSession();
    if (!session?.user) {
        throw new ApiError("Please log in first to create admin accounts.", 401);
    }
    if (session.user.role !== "SUPERADMIN") {
        throw new ApiError("Access denied. Superadmin privileges required.", 403);
    }

    const body = await req.json();
    const { name, email, phone, password, role } = body;
    const targetRole = role === "SUPPORT" ? "SUPPORT" : "AGENT";

    if (!name || !email || !password) {
        throw new ApiError("Name, email address, and password are required.", 400);
    }

    if (name.trim().length < 2) {
        throw new ApiError("Name must be at least 2 characters long.", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError("Please provide a valid email address.", 400);
    }

    if (phone) {
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            throw new ApiError("Phone number must be exactly 10 digits.", 400);
        }
    }

    if (password.length < 6) {
        throw new ApiError("Password must be at least 6 characters long.", 400);
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new ApiError("A user with this email address already exists.", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newadmin = await db.$transaction(async (prisma) => {
        const user = await prisma.user.create({
            data: {
                name,
                email,
                phone: phone || "",
                passwordHash: hashedPassword,
                role: targetRole,
                city: "System",
                pincode: "000000",
            }
        });

        if (targetRole === "AGENT") {
            await prisma.agentProfile.create({
                data: { userId: user.id }
            });
        }

        return user;
    });

    return { agent: newadmin };
};
