import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(req: Request, { params }: { params: Promise<{ adminId: string }> }) {
    try {
        const session = await getAuthSession();
        if (!session?.user || session.user.role !== "SUPERADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, email, phone, isActive, password, canManageOffers, canManageBanners } = body;
        const { adminId } = await params;

        const existingUser = await db.user.findUnique({ where: { id: adminId } });
        if (!existingUser || existingUser.role !== "AGENT") {
            return NextResponse.json({ message: "Admin not found" }, { status: 404 });
        }

        const updatedUser = await db.user.update({
            where: { id: adminId },
            data: {
                name: name || existingUser.name,
                email: email || existingUser.email,
                phone: phone !== undefined ? phone : existingUser.phone,
                isActive: isActive !== undefined ? isActive : existingUser.isActive,
                passwordHash: password ? await bcrypt.hash(password, 10) : existingUser.passwordHash,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isActive: true,
                agentProfile: {
                    select: {
                        canManageOffers: true,
                        canManageBanners: true
                    }
                }
            }
        });

        if (canManageOffers !== undefined || canManageBanners !== undefined) {
            await db.agentProfile.upsert({
                where: { userId: adminId },
                update: {
                    canManageOffers: canManageOffers !== undefined ? canManageOffers : undefined,
                    canManageBanners: canManageBanners !== undefined ? canManageBanners : undefined
                },
                create: {
                    userId: adminId,
                    canManageOffers: canManageOffers || false,
                    canManageBanners: canManageBanners || false
                }
            });

            // Refresh to get updated agent profile
            const refreshedUser = await db.user.findUnique({
                where: { id: adminId },
                select: {
                    id: true, name: true, email: true, phone: true, isActive: true,
                    agentProfile: {
                        select: { canManageOffers: true, canManageBanners: true }
                    }
                }
            });
            return NextResponse.json({ message: "Admin updated successfully", admin: refreshedUser }, { status: 200 });
        }

        return NextResponse.json({ message: "Admin updated successfully", admin: updatedUser }, { status: 200 });

    } catch (error) {
        console.error("Error updating agent:", error);
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ adminId: string }> }) {
    try {
        const session = await getAuthSession();
        if (!session?.user || session.user.role !== "SUPERADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { adminId } = await params;

        // Ensure we are only deleting AGENTs
        const existingUser = await db.user.findUnique({ where: { id: adminId } });
        if (!existingUser || existingUser.role !== "AGENT") {
            return NextResponse.json({ message: "Admin not found or invalid type" }, { status: 404 });
        }

        // Prisma Cascade delete will handle AgentProfile cleanup based on userId Foreign Key
        await db.user.delete({
            where: { id: adminId }
        });

        return NextResponse.json({ message: "Admin deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error("Error deleting agent:", error);
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}
