import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { uploadImage } from "@/lib/upload";
import { ApiError } from "@/lib/api-error";
import jwt from "jsonwebtoken";

export const registerUser = async (req: Request) => {
    const contentType = req.headers.get('content-type') || "";

    let finalName, finalEmail, finalPhone, finalPassword, finalRole, finalSellerType, finalCity, finalPincode, finalBusinessName, finalAddressFlat, finalAddressArea, finalAddressLandmark, finalBusinessCategory;
    let adhaarUrl = "pending_url", fssaiUrl = null;
    let kitchenImages: string[] = [];
    let cuisineImages: string[] = [];

    if (contentType.includes('application/json')) {
        const body = await req.json();
        finalName = body.name;
        finalEmail = body.email;
        finalPhone = body.phone;
        finalPassword = body.password;
        finalRole = body.role;
        finalSellerType = body.sellerType;
        finalCity = body.city;
        finalPincode = body.pincode;
        finalBusinessName = body.businessName;
        finalAddressFlat = body.addressFlat;
        finalAddressArea = body.addressArea;
        finalAddressLandmark = body.addressLandmark;
        finalBusinessCategory = body.businessCategory;
    } else {
        const formData = await req.formData();

        finalName = formData.get("name") as string;
        finalEmail = formData.get("email") as string;
        finalPhone = formData.get("phone") as string;
        finalPassword = formData.get("password") as string;
        finalRole = formData.get("role") as string;
        finalSellerType = formData.get("sellerType") as string;
        finalCity = formData.get("city") as string;
        finalPincode = formData.get("pincode") as string;
        finalBusinessName = formData.get("businessName") as string;
        finalAddressFlat = formData.get("addressFlat") as string;
        finalAddressArea = formData.get("addressArea") as string;
        finalAddressLandmark = formData.get("addressLandmark") as string;
        finalBusinessCategory = formData.get("businessCategory") as string;

        const saveFile = async (file: File | null) => {
            if (!file || typeof file === "string" || file.size === 0) return null;
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            return await uploadImage(buffer, file.type, file.name, "sellers");
        };

        try {
            console.log("Starting concurrent file uploads...");
            const adhaarFile = formData.get("adhaarFile") as File;
            const fssaiFile = formData.get("fssaiFile") as File;

            const kitchenFiles: File[] = [];
            for (let i = 0; i < 3; i++) {
                const kFile = formData.get(`kitchenImage_${i}`) as File;
                if (kFile) kitchenFiles.push(kFile);
            }

            const cuisineFiles: File[] = [];
            for (let i = 0; i < 3; i++) {
                const cFile = formData.get(`cuisineImage_${i}`) as File;
                if (cFile) cuisineFiles.push(cFile);
            }

            // Await all promises concurrently
            const [savedAdhaar, savedFssai, resolvedKitchen, resolvedCuisine] = await Promise.all([
                saveFile(adhaarFile),
                saveFile(fssaiFile),
                Promise.all(kitchenFiles.map(saveFile)),
                Promise.all(cuisineFiles.map(saveFile))
            ]);

            if (savedAdhaar) {
                adhaarUrl = savedAdhaar;
                console.log("Aadhar card saved:", adhaarUrl);
            }

            if (savedFssai) {
                fssaiUrl = savedFssai;
                console.log("FSSAI license saved:", fssaiUrl);
            }

            kitchenImages = resolvedKitchen.filter(Boolean) as string[];
            cuisineImages = resolvedCuisine.filter(Boolean) as string[];

            console.log("All concurrent file uploads completed.");
        } catch (uploadError: any) {
            console.error("File upload error during registration:", uploadError);
            throw new ApiError(`Upload failed: ${uploadError.message}`, 500);
        }
    }

    console.log("Registering user:", { finalName, finalEmail, finalRole });

    if (!finalName || !finalEmail || !finalPassword || !finalRole) {
        console.error("Missing required fields for registration");
        throw new ApiError("Missing required fields", 400);
    }

    finalEmail = finalEmail.toLowerCase();

    const existingUser = await db.user.findUnique({
        where: { email: finalEmail },
    });

    if (existingUser) {
        console.error("User already exists:", finalEmail);
        throw new ApiError("User already exists with this email", 409);
    }

    const passwordHash = await bcrypt.hash(finalPassword, 10);

    try {
        const user = await db.user.create({
            data: {
                name: finalName,
                email: finalEmail,
                phone: finalPhone || "",
                city: finalCity || "",
                pincode: finalPincode || "",
                passwordHash,
                role: finalRole as any,
                isActive: true,
            },
        });

        console.log("User created:", user.id);

        if (finalRole === "SELLER") {
            console.log("Creating seller profile...");
            await db.sellerProfile.create({
                data: {
                    userId: user.id,
                    type: finalSellerType || "Uncategorized",
                    businessName: finalBusinessName || `${finalName}'s Kitchen`,
                    addressFlat: finalAddressFlat || "",
                    addressLocality: finalAddressArea || "",
                    addressLandmark: finalAddressLandmark || null,
                    kitchenImages: JSON.stringify(kitchenImages),
                    cuisineImages: JSON.stringify(cuisineImages),
                    adhaarUrl: adhaarUrl,
                    fssaiUrl: fssaiUrl,
                    trackingId: `SHOP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                    businessCategory: finalBusinessCategory || "FOOD",
                }
            });
            console.log("Seller profile created successfully");
        }

        return {
            user: { id: user.id, email: user.email, role: user.role }
        };
    } catch (dbError: any) {
        console.error("Database registration error:", dbError);
        throw dbError;
    }
};

export const loginUser = async (req: Request) => {
    const { email, password } = await req.json();

    if (!email || !password) {
        throw new ApiError("Email and password are required", 400);
    }

    const normalizedEmail = email.toLowerCase();

    const user = await db.user.findUnique({
        where: { email: normalizedEmail }
    });

    if (!user) {
        throw new ApiError("Invalid credentials", 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
        throw new ApiError("Invalid credentials", 401);
    }

    // Use NEXTAUTH_SECRET as the JWT secret, or a fallback for dev
    const secret = process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_only";

    // Create a robust JWT payload
    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        },
        secret,
        { expiresIn: "30d" } // 30 day expiration for mobile convenience
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    };
};
