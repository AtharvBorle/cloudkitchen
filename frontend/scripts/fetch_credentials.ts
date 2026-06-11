import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const sellers = await prisma.sellerProfile.findMany({
        include: {
            user: true,
            deliveryPersons: {
                include: {
                    user: true,
                }
            }
        }
    });

    console.log("=== Sellers and Delivery Partners ===");
    sellers.forEach(seller => {
        console.log(`\nSeller: ${seller.businessName || seller.user.name}`);
        console.log(`  Name: ${seller.user.name}`);
        console.log(`  Username (Email): ${seller.user.email}`);
        // Note: Passwords are hashed in the database.
        console.log(`  Password Hash: ${seller.user.passwordHash}`);
        console.log(`  Delivery Partners:`);
        if (seller.deliveryPersons.length === 0) {
            console.log(`    None`);
        } else {
            seller.deliveryPersons.forEach(dp => {
                console.log(`    - Name: ${dp.name}`);
                console.log(`      Username (Email): ${dp.user.email}`);
                console.log(`      Password Hash: ${dp.user.passwordHash}`);
            });
        }
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
