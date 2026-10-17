import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import {
    sendSellerApplicationApprovedEmail,
    sendSellerApplicationRejectedEmail,
    sendKitchenPermanentlyDeletedEmail,
} from "@/lib/emailService";

export async function PUT(req: Request, { params }: { params: Promise<{ sellerId: string }> }) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return NextResponse.json({ success: false, message: "Please log in first to update seller information.", error: "Please log in first to update seller information." }, { status: 401 });
        }
        if (session.user.role !== "SUPERADMIN") {
            return NextResponse.json({ success: false, message: "Access denied. Superadmin privileges required.", error: "Access denied. Superadmin privileges required." }, { status: 403 });
        }

        const body = await req.json();
        const { name, phone, isActive, businessName, type, verificationStatus, isOnline, foodVerificationStatus, propertyVerificationStatus, foodType } = body;
        const { sellerId } = await params;

        const existingUser = await db.user.findUnique({
            where: { id: sellerId },
            include: { sellerProfile: true }
        });

        if (!existingUser || existingUser.role !== "SELLER") {
            return NextResponse.json({ success: false, message: "The specified seller account could not be found.", error: "The specified seller account could not be found." }, { status: 404 });
        }

        // Update the user
        await db.user.update({
            where: { id: sellerId },
            data: {
                name: name || existingUser.name,
                phone: phone !== undefined ? phone : existingUser.phone,
                isActive: isActive !== undefined ? isActive : existingUser.isActive,
            }
        });

        // Update the seller profile if it exists
        if (existingUser.sellerProfile) {
            let finalFoodStatus = foodVerificationStatus;
            let finalPropertyStatus = propertyVerificationStatus;

            if (verificationStatus === "APPROVED" && existingUser.sellerProfile.verificationStatus !== "APPROVED") {
                const category = existingUser.sellerProfile.businessCategory;
                if (category === "FOOD") {
                    finalFoodStatus = "APPROVED";
                    finalPropertyStatus = "NONE";
                } else if (category === "PROPERTY") {
                    finalFoodStatus = "NONE";
                    finalPropertyStatus = "APPROVED";
                } else if (category === "BOTH") {
                    finalFoodStatus = "APPROVED";
                    finalPropertyStatus = "APPROVED";
                }
            }

            const resolvedFoodStatus = finalFoodStatus !== undefined ? finalFoodStatus : existingUser.sellerProfile.foodVerificationStatus;
            const resolvedPropertyStatus = finalPropertyStatus !== undefined ? finalPropertyStatus : existingUser.sellerProfile.propertyVerificationStatus;
            
            let resolvedBusinessCategory = existingUser.sellerProfile.businessCategory;
            if (resolvedFoodStatus === "APPROVED" && resolvedPropertyStatus === "APPROVED") {
                resolvedBusinessCategory = "BOTH";
            } else if (resolvedFoodStatus === "APPROVED") {
                resolvedBusinessCategory = "FOOD";
            } else if (resolvedPropertyStatus === "APPROVED") {
                resolvedBusinessCategory = "PROPERTY";
            }

            const updatedSellerProfile = await db.sellerProfile.update({
                where: { userId: sellerId },
                data: {
                    businessName: businessName || existingUser.sellerProfile.businessName,
                    type: type || existingUser.sellerProfile.type,
                    verificationStatus: verificationStatus || existingUser.sellerProfile.verificationStatus,
                    isOnline: isOnline !== undefined ? isOnline : existingUser.sellerProfile.isOnline,
                    foodVerificationStatus: finalFoodStatus !== undefined ? finalFoodStatus : existingUser.sellerProfile.foodVerificationStatus,
                    propertyVerificationStatus: finalPropertyStatus !== undefined ? finalPropertyStatus : existingUser.sellerProfile.propertyVerificationStatus,
                    businessCategory: resolvedBusinessCategory,
                    ...(foodType !== undefined && typeof foodType === "string" && foodType.trim() ? { foodType: foodType.trim().toUpperCase() } : {})
                }
            });

            if (verificationStatus && verificationStatus !== existingUser.sellerProfile.verificationStatus) {
                if (verificationStatus === "APPROVED" && existingUser.email) {
                    sendSellerApplicationApprovedEmail({
                        sellerName: existingUser.name,
                        sellerEmail: existingUser.email,
                        businessName: updatedSellerProfile.businessName,
                    }).catch(err => console.error("Error sending approved email:", err));
                } else if (verificationStatus === "REJECTED" && existingUser.email) {
                    sendSellerApplicationRejectedEmail({
                        sellerName: existingUser.name,
                        sellerEmail: existingUser.email,
                        businessName: updatedSellerProfile.businessName,
                        reason: body.rejectionReason || body.reason || "Documents could not be verified or requirements were not met. Please review and re-upload your verification details.",
                    }).catch(err => console.error("Error sending rejected email:", err));
                }
            }
        }

        return NextResponse.json({ message: "Seller updated successfully" }, { status: 200 });

    } catch (error) {
        console.error("Error updating seller:", error);
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ sellerId: string }> }) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return NextResponse.json({ success: false, message: "Please log in first to delete seller accounts.", error: "Please log in first to delete seller accounts." }, { status: 401 });
        }
        if (session.user.role !== "SUPERADMIN") {
            return NextResponse.json({ success: false, message: "Access denied. Superadmin privileges required.", error: "Access denied. Superadmin privileges required." }, { status: 403 });
        }

        const { sellerId } = await params;

        // Ensure we are only deleting SELLERs
        const existingUser = await db.user.findUnique({ 
            where: { id: sellerId },
            include: { sellerProfile: true }
        });
        if (!existingUser || existingUser.role !== "SELLER") {
            return NextResponse.json({ success: false, message: "The specified seller account could not be found.", error: "The specified seller account could not be found." }, { status: 404 });
        }

        // Manually clean up immediate Seller relation to help SQLite bypass tight 
        // cascade locking errors in the development environment
        await db.sellerProfile.deleteMany({
            where: { userId: sellerId }
        });

        // Prisma Cascade delete will handle remaining Orders, etc. cleanup based on userId Foreign Key
        await db.user.delete({
            where: { id: sellerId }
        });

        if (existingUser.email) {
            sendKitchenPermanentlyDeletedEmail({
                sellerName: existingUser.name,
                sellerEmail: existingUser.email,
                businessName: existingUser.sellerProfile?.businessName || "Your Kitchen",
            }).catch(err => console.error("Error sending kitchen permanent delete email:", err));
        }

        return NextResponse.json({ message: "Seller deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error("Error deleting seller:", error);
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}
