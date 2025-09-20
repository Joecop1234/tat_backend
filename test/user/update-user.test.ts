import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Hono } from "hono";
import UserController from "../../controllers/UserController";
import { connectDB } from "../../connect_db";

// สร้าง test app
const app = new Hono();
app.route('/api/users', UserController);

// ตัวแปรสำหรับเก็บข้อมูล test
let testUserId: string;
let testUserEmail: string;

describe("Update User API Tests", () => {
    
    beforeAll(async () => {
        await connectDB();
        console.log("Connected to test database");
        
        // สร้าง test user ก่อน
        testUserEmail = `test_update_${Date.now()}@example.com`;
        const userData = {
            name: "Test Update User",
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
        console.log("Created test user with ID:", testUserId);
    });

    afterAll(async () => {
        // ลบข้อมูล test
        try {
            const db = await connectDB();
            const usersCollection = db.collection('users');
            await usersCollection.deleteMany({ email: { $regex: "test_update.*@example.com" } });
            console.log("Cleaned up test data");
        } catch (error) {
            console.error("Cleanup error:", error);
        }
    });

    test("อัพเดท name สำเร็จ", async () => {
        const updateData = {
            name: "Updated Name"
        };

        const updateReq = new Request(`http://localhost:3000/api/users/update/${testUserId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateData)
        });

        const res = await app.fetch(updateReq);
        const data = await res.json() as any;

        console.log("Update response status:", res.status);
        console.log("Update response data:", data);

        expect(res.status).toBe(200);
        expect(data.message).toBe("User updated successfully");
        expect(data.modifiedCount).toBe(1);

        // ตรวจสอบว่าข้อมูลถูกอัพเดทจริง
        const getUserReq = new Request(`http://localhost:3000/api/users/user/${testUserId}`);
        const getUserRes = await app.fetch(getUserReq);
        const getUserData = await getUserRes.json() as any;
        
        expect(getUserData.data.name).toBe("Updated Name");
    });

    test("อัพเดท email สำเร็จ", async () => {
        const newEmail = `updated_${Date.now()}@example.com`;
        const updateData = {
            email: newEmail
        };

        const updateReq = new Request(`http://localhost:3000/api/users/update/${testUserId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateData)
        });

        const res = await app.fetch(updateReq);
        const data = await res.json() as any;

        expect(res.status).toBe(200);
        expect(data.modifiedCount).toBe(1);

        // ตรวจสอบว่าข้อมูลถูกอัพเดทจริง
        const getUserReq = new Request(`http://localhost:3000/api/users/user/${testUserId}`);
        const getUserRes = await app.fetch(getUserReq);
        const getUserData = await getUserRes.json() as any;
        
        expect(getUserData.data.email).toBe(newEmail);
    });

    test("อัพเดท phone สำเร็จ", async () => {
        const updateData = {
            phone: "0899999999"
        };

        const updateReq = new Request(`http://localhost:3000/api/users/update/${testUserId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateData)
        });

        const res = await app.fetch(updateReq);
        const data = await res.json() as any;

        expect(res.status).toBe(200);
        expect(data.modifiedCount).toBe(1);

        // ตรวจสอบว่าข้อมูลถูกอัพเดทจริง
        const getUserReq = new Request(`http://localhost:3000/api/users/user/${testUserId}`);
        const getUserRes = await app.fetch(getUserReq);
        const getUserData = await getUserRes.json() as any;
        
        expect(getUserData.data.phone).toBe("0899999999");
    });

    test("ลบ phone (set เป็น null)", async () => {
        const updateData = {
            phone: null
        };

        const updateReq = new Request(`http://localhost:3000/api/users/update/${testUserId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateData)
        });

        const res = await app.fetch(updateReq);
        const data = await res.json() as any;

        expect(res.status).toBe(200);
        expect(data.modifiedCount).toBe(1);

        // ตรวจสอบว่าข้อมูลถูกอัพเดทจริง
        const getUserReq = new Request(`http://localhost:3000/api/users/user/${testUserId}`);
        const getUserRes = await app.fetch(getUserReq);
        const getUserData = await getUserRes.json() as any;
        
        expect(getUserData.data.phone).toBe(null);
    });

    test("อัพเดท role สำเร็จ", async () => {
        const updateData = {
            role: "admin"
        };

        const updateReq = new Request(`http://localhost:3000/api/users/update/${testUserId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateData)
        });

        const res = await app.fetch(updateReq);
        const data = await res.json() as any;

        expect(res.status).toBe(200);
        expect(data.modifiedCount).toBe(1);

        // ตรวจสอบว่าข้อมูลถูกอัพเดทจริง
        const getUserReq = new Request(`http://localhost:3000/api/users/user/${testUserId}`);
        const getUserRes = await app.fetch(getUserReq);
        const getUserData = await getUserRes.json() as any;
        
        expect(getUserData.data.role).toBe("admin");
    });

    test("อัพเดท password สำเร็จ", async () => {
        // ดึงข้อมูล user ปัจจุบันก่อนเพื่อใช้ email ที่ถูกต้อง
        const getUserReq = new Request(`http://localhost:3000/api/users/user/${testUserId}`);
        const getUserRes = await app.fetch(getUserReq);
        const getUserData = await getUserRes.json() as any;
        const currentEmail = getUserData.data.email;

        const updateData = {
            password: "newpassword123"
        };

        const updateReq = new Request(`http://localhost:3000/api/users/update/${testUserId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateData)
        });

        const res = await app.fetch(updateReq);
        const data = await res.json() as any;

        expect(res.status).toBe(200);
        expect(data.modifiedCount).toBe(1);

        // ทดสอบ login ด้วย password ใหม่และ email ปัจจุบัน
        const loginData = {
            email: currentEmail, // ใช้ email ปัจจุบัน
            password: "newpassword123"
        };

        const loginReq = new Request("http://localhost:3000/api/users/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(loginData)
        });

        const loginRes = await app.fetch(loginReq);
        const loginResData = await loginRes.json() as any;
        
        console.log("Login test - Email used:", currentEmail);
        console.log("Login response status:", loginRes.status);
        console.log("Login response data:", loginResData);
        
        expect(loginRes.status).toBe(200); // ควร login ได้ด้วย password ใหม่
    });

    test("ไม่อัพเดทเมื่อ password สั้นเกินไป", async () => {
        const updateData = {
            password: "123" // สั้นเกินไป
        };

        const updateReq = new Request(`http://localhost:3000/api/users/update/${testUserId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateData)
        });

        const res = await app.fetch(updateReq);
        const data = await res.json() as any;

        expect(res.status).toBe(400);
        expect(data.error).toBe("Password must be at least 6 characters long");
    });

    test("อัพเดทหลายฟิลด์พร้อมกัน", async () => {
        const updateData = {
            name: "Multi Update User",
            phone: "0877777777",
            role: "moderator"
        };

        const updateReq = new Request(`http://localhost:3000/api/users/update/${testUserId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateData)
        });

        const res = await app.fetch(updateReq);
        const data = await res.json() as any;

        expect(res.status).toBe(200);
        expect(data.modifiedCount).toBe(1);

        // ตรวจสอบว่าข้อมูลทั้งหมดถูกอัพเดท
        const getUserReq = new Request(`http://localhost:3000/api/users/user/${testUserId}`);
        const getUserRes = await app.fetch(getUserReq);
        const getUserData = await getUserRes.json() as any;
        
        expect(getUserData.data.name).toBe("Multi Update User");
        expect(getUserData.data.phone).toBe("0877777777");
        expect(getUserData.data.role).toBe("moderator");
    });

    test("ไม่อัพเดทเมื่อ user ไม่พบ", async () => {
        const fakeId = "507f1f77bcf86cd799439011";
        const updateData = {
            name: "Should Not Update"
        };

        const updateReq = new Request(`http://localhost:3000/api/users/update/${fakeId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateData)
        });

        const res = await app.fetch(updateReq);
        const data = await res.json() as any;

        expect(res.status).toBe(404);
        expect(data.error).toBe("User not found");
    });

    test("Error เมื่อ ID format ไม่ถูกต้อง", async () => {
        const invalidId = "invalid-id";
        const updateData = {
            name: "Should Error"
        };

        const updateReq = new Request(`http://localhost:3000/api/users/update/${invalidId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateData)
        });

        const res = await app.fetch(updateReq);
        const data = await res.json() as any;

        expect(res.status).toBe(500);
        expect(data.error).toBeDefined();
    });

    test("อัพเดท updatedAt timestamp", async () => {
        // ดึงข้อมูล user ก่อนอัพเดท
        const getUserReq1 = new Request(`http://localhost:3000/api/users/user/${testUserId}`);
        const getUserRes1 = await app.fetch(getUserReq1);
        const getUserData1 = await getUserRes1.json() as any;
        const originalUpdatedAt = getUserData1.data.updatedAt;

        // รอสักครู่แล้วค่อยอัพเดท
        await new Promise(resolve => setTimeout(resolve, 100));

        const updateData = {
            name: "Timestamp Test User"
        };

        const updateReq = new Request(`http://localhost:3000/api/users/update/${testUserId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateData)
        });

        await app.fetch(updateReq);

        // ดึงข้อมูล user หลังอัพเดท
        const getUserReq2 = new Request(`http://localhost:3000/api/users/user/${testUserId}`);
        const getUserRes2 = await app.fetch(getUserReq2);
        const getUserData2 = await getUserRes2.json() as any;
        const newUpdatedAt = getUserData2.data.updatedAt;

        // updatedAt ควรเปลี่ยนแปลง
        expect(new Date(newUpdatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());
    });

    test("อัพเดทด้วย empty object (เฉพาะ updatedAt)", async () => {
        const updateData = {}; // empty object

        const updateReq = new Request(`http://localhost:3000/api/users/update/${testUserId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateData)
        });

        const res = await app.fetch(updateReq);
        const data = await res.json() as any;

        expect(res.status).toBe(200);
        expect(data.modifiedCount).toBe(1); // ควร update updatedAt
    });
});