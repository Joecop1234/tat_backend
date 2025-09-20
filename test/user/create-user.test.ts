import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Hono } from "hono";
import UserController from "../controllers/UserController";
import { connectDB } from "../connect_db";

// สร้าง test app
const app = new Hono();
app.route('/api/users', UserController);

// test  api create-user
describe("Create User API Tests", () => {
    
    beforeAll(async () => {
        await connectDB();
        console.log("Connected to test database");
    });

    afterAll(async () => {
        // ลบข้อมูล test
        try {
            const db = await connectDB();
            const usersCollection = db.collection('users');
            await usersCollection.deleteMany({ email: { $regex: "test_.*@example.com" } });
            console.log("Cleaned up test data");
        } catch (error) {
            console.error("Cleanup error:", error);
        }
    });

    test("สร้าง user ใหม่สำเร็จ", async () => {
        const testUserEmail = `test_${Date.now()}@example.com`;
        const userData = {
            name: "Test User",
            email: testUserEmail,
            password: "password123",
            phone: "0812345678",
            role: "user"
        };

        const req = new Request("http://localhost:3000/api/users/create-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        const res = await app.fetch(req);
        const data = await res.json() as any;

        console.log("Response status:", res.status);
        console.log("Response data:", data);

        expect(res.status).toBe(201);
        expect(data.message).toBe("User created successfully");
        expect(data.data.user.name).toBe(userData.name);
        expect(data.data.user.email).toBe(userData.email);
        expect(data.data.user.phone).toBe(userData.phone);
        expect(data.data.user.role).toBe(userData.role);
        expect(data.data.user.password).toBeUndefined();
        expect(data.data.insertedId).toBeDefined();
        expect(data.data.user.createdAt).toBeDefined();
        expect(data.data.user.updatedAt).toBeDefined();
    });

    test("สร้าง user ด้วยข้อมูลขั้นต่ำ", async () => {
        const testUserEmail = `test_minimal_${Date.now()}@example.com`;
        const userData = {
            name: "Minimal User",
            email: testUserEmail,
            password: "password123"
            // ไม่มี phone และ role
        };

        const req = new Request("http://localhost:3000/api/users/create-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        const res = await app.fetch(req);
        const data = await res.json() as any;

        expect(res.status).toBe(201);
        expect(data.message).toBe("User created successfully");
        expect(data.data.user.name).toBe(userData.name);
        expect(data.data.user.email).toBe(userData.email);
        expect(data.data.user.phone).toBe(null);
        expect(data.data.user.role).toBe("user"); 
    });

    test("ไม่สร้าง user เมื่อไม่มี name", async () => {
        const userData = {
            // ไม่มี name
            email: "test@example.com",
            password: "password123"
        };

        const req = new Request("http://localhost:3000/api/users/create-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        const res = await app.fetch(req);
        const data = await res.json() as any;

        expect(res.status).toBe(400);
        expect(data.error).toBe("Name, email, and password are required");
    });

    test("ไม่สร้าง user เมื่อไม่มี email", async () => {
        const userData = {
            name: "Test User",
            password: "password123"
        };

        const req = new Request("http://localhost:3000/api/users/create-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        const res = await app.fetch(req);
        const data = await res.json() as any;

        expect(res.status).toBe(400);
        expect(data.error).toBe("Name, email, and password are required");
    });

    test("ไม่สร้าง user เมื่อไม่มี password", async () => {
        const userData = {
            name: "Test User",
            email: "test@example.com"
            // ไม่มี password
        };

        const req = new Request("http://localhost:3000/api/users/create-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        const res = await app.fetch(req);
        const data = await res.json() as any;

        expect(res.status).toBe(400);
        expect(data.error).toBe("Name, email, and password are required");
    });

    test("ไม่สร้าง user เมื่อ email ซ้ำ", async () => {
        const testUserEmail = `test_duplicate_${Date.now()}@example.com`;
        const userData1 = {
            name: "Test User 1",
            email: testUserEmail,
            password: "password123"
        };

        const req1 = new Request("http://localhost:3000/api/users/create-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData1)
        });
        
        await app.fetch(req1);
        const userData2 = {
            name: "Test User 2",
            email: testUserEmail, 
            password: "password456"
        };

        const req2 = new Request("http://localhost:3000/api/users/create-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData2)
        });

        const res2 = await app.fetch(req2);
        const data2 = await res2.json() as any;

        expect(res2.status).toBe(409);
        expect(data2.error).toBe("Email already exists");
    });

    test("สร้าง user ด้วย role admin", async () => {
        const testUserEmail = `test_admin_${Date.now()}@example.com`;
        const userData = {
            name: "Admin User",
            email: testUserEmail,
            password: "adminpass123",
            role: "admin"
        };

        const req = new Request("http://localhost:3000/api/users/create-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        const res = await app.fetch(req);
        const data = await res.json() as any;

        expect(res.status).toBe(201);
        expect(data.data.user.role).toBe("admin");
    });

    test("ทดสอบ password hashing", async () => {
        const testUserEmail = `test_hash_${Date.now()}@example.com`;
        const userData = {
            name: "Hash Test User",
            email: testUserEmail,
            password: "password123"
        };

        const req = new Request("http://localhost:3000/api/users/create-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        const res = await app.fetch(req);
        const data = await res.json() as any;

        expect(res.status).toBe(201);
        
        // ตรวจสอบว่า password ไม่ได้ return กลับมา
        expect(data.data.user.password).toBeUndefined();
        
        // ตรวจสอบใน database ว่า password ถูก hash แล้ว
        const db = await connectDB();
        const usersCollection = db.collection('users');
        const savedUser = await usersCollection.findOne({ email: testUserEmail });
        
        expect(savedUser?.password).toBeDefined();
        expect(savedUser?.password).not.toBe("password123"); 
        expect(savedUser?.password.length).toBeGreaterThan(20); 
});
});



// test api get user by id
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

    test("ตรวจสอบโครงสร้าง response", async () => {
        const getUserReq = new Request(`http://localhost:3000/api/users/user/${testUserId}`);
        const res = await app.fetch(getUserReq);
        const data = await res.json() as any;

        expect(res.status).toBe(200);
        
        // ตรวจสอบโครงสร้าง response
        expect(data).toHaveProperty('message');
        expect(data).toHaveProperty('data');
        
        // ตรวจสอบโครงสร้าง data object
        expect(data.data).toHaveProperty('_id');
        expect(data.data).toHaveProperty('name');
        expect(data.data).toHaveProperty('email');
        expect(data.data).toHaveProperty('phone');
        expect(data.data).toHaveProperty('role');
        expect(data.data).toHaveProperty('createdAt');
        expect(data.data).toHaveProperty('updatedAt');
        
        // ตรวจสอบว่าไม่มี sensitive data
        expect(data.data).not.toHaveProperty('password');
    });

    test("ตรวจสอบ data types", async () => {
        const getUserReq = new Request(`http://localhost:3000/api/users/user/${testUserId}`);
        const res = await app.fetch(getUserReq);
        const data = await res.json() as any;

        expect(res.status).toBe(200);
        
        // ตรวจสอบ data types
        expect(typeof data.data._id).toBe('string');
        expect(typeof data.data.name).toBe('string');
        expect(typeof data.data.email).toBe('string');
        expect(typeof data.data.role).toBe('string');
        
        // phone อาจเป็น string หรือ null
        if (data.data.phone !== null) {
            expect(typeof data.data.phone).toBe('string');
        }
        
        // createdAt และ updatedAt ควรเป็น valid date strings
        expect(new Date(data.data.createdAt)).toBeInstanceOf(Date);
        expect(new Date(data.data.updatedAt)).toBeInstanceOf(Date);
    });

    test("ดึงข้อมูล user ที่ไม่มี phone", async () => {
        // สร้าง user ไม่มี phone
        const testUserEmail = `test_nophone_${Date.now()}@example.com`;
        const userData = {
            name: "No Phone User",
            email: testUserEmail,
            password: "password123"
            // ไม่มี phone
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
        expect(data.data.phone).toBe(null); 
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