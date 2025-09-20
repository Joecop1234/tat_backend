import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Hono } from "hono";
import UserController from "../../controllers/UserController";
import { connectDB } from "../../connect_db";

// สร้าง test app
const app = new Hono();
app.route('/api/users', UserController);

// ตัวแปรสำหรับเก็บข้อมูล test
let testUserId: string;
let testUserData: any;

describe("Get User by ID API Tests", () => {
    
    beforeAll(async () => {
        await connectDB();
        console.log("Connected to test database");
        
        // สร้าง test user ก่อน
        const testUserEmail = `test_getuser_${Date.now()}@example.com`;
        const userData = {
            name: "Test Get User",
            email: testUserEmail,
            password: "password123",
            phone: "0812345678",
            role: "user"
        };

        const createReq = new Request("http://localhost:3000/api/users/create-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        const createRes = await app.fetch(createReq);
        const createData = await createRes.json() as any;
        
        testUserId = createData.data.insertedId;
        testUserData = createData.data.user;
        
        console.log("Created test user with ID:", testUserId);
    });

    afterAll(async () => {
        // ลบข้อมูล test
        try {
            const db = await connectDB();
            const usersCollection = db.collection('users');
            await usersCollection.deleteMany({ email: { $regex: "test_getuser_.*@example.com" } });
            console.log("Cleaned up test data");
        } catch (error) {
            console.error("Cleanup error:", error);
        }
    });

    test("ดึงข้อมูล user ตาม ID สำเร็จ", async () => {
        const getUserReq = new Request(`http://localhost:3000/api/users/user/${testUserId}`);
        const res = await app.fetch(getUserReq);
        
        console.log("Response status:", res.status);
        
        const data = await res.json() as any;
        console.log("Response data:", data);

        expect(res.status).toBe(200);
        expect(data.message).toBe("User found");
        
        // ตรวจสอบข้อมูล user
        expect(data.data._id).toBe(testUserId);
        expect(data.data.name).toBe(testUserData.name);
        expect(data.data.email).toBe(testUserData.email);
        expect(data.data.phone).toBe(testUserData.phone);
        expect(data.data.role).toBe(testUserData.role);
        expect(data.data.createdAt).toBeDefined();
        expect(data.data.updatedAt).toBeDefined();
        
        // ตรวจสอบว่าไม่ return password
        expect(data.data.password).toBeUndefined();
    });

    test("ไม่พบ user เมื่อ ID ไม่มีในระบบ", async () => {
        // ใช้ MongoDB ObjectId ที่ valid แต่ไม่มีในระบบ
        const fakeId = "507f1f77bcf86cd799439011";

        const getUserReq = new Request(`http://localhost:3000/api/users/user/${fakeId}`);
        const res = await app.fetch(getUserReq);
        const data = await res.json() as any;

        expect(res.status).toBe(404);
        expect(data.error).toBe("User not found");
    });

    test("Error เมื่อ ID format ไม่ถูกต้อง", async () => {
        const invalidId = "invalid-id-format";

        const getUserReq = new Request(`http://localhost:3000/api/users/user/${invalidId}`);
        const res = await app.fetch(getUserReq);
        const data = await res.json() as any;

        expect(res.status).toBe(500);
        expect(data.error).toBeDefined();
    });
    test("ดึงข้อมูล user ที่ไม่มี phone", async () => {
        // สร้าง user ไม่มี phone
        const testUserEmail = `test_nophone_${Date.now()}@example.com`;
        const userData = {
            name: "No Phone User",
            email: testUserEmail,
            password: "password123"
        };

        const createReq = new Request("http://localhost:3000/api/users/create-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        const createRes = await app.fetch(createReq);
        const createData = await createRes.json() as any;
        const noPhoneUserId = createData.data.insertedId;

        // ดึงข้อมูล user
        const getUserReq = new Request(`http://localhost:3000/api/users/user/${noPhoneUserId}`);
        const res = await app.fetch(getUserReq);
        const data = await res.json() as any;

        expect(res.status).toBe(200);
        expect(data.data.name).toBe("No Phone User");
        expect(data.data.phone).toBe(null); // ควรเป็น null
    });

    test("ดึงข้อมูล admin user", async () => {
        // สร้าง admin user
        const testAdminEmail = `test_admin_${Date.now()}@example.com`;
        const adminData = {
            name: "Admin User",
            email: testAdminEmail,
            password: "adminpass123",
            role: "admin"
        };

        const createReq = new Request("http://localhost:3000/api/users/create-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(adminData)
        });

        const createRes = await app.fetch(createReq);
        const createData = await createRes.json() as any;
        const adminUserId = createData.data.insertedId;

        // ดึงข้อมูล admin user
        const getUserReq = new Request(`http://localhost:3000/api/users/user/${adminUserId}`);
        const res = await app.fetch(getUserReq);
        const data = await res.json() as any;

        expect(res.status).toBe(200);
        expect(data.data.role).toBe("admin");
        expect(data.data.name).toBe("Admin User");
    });
});