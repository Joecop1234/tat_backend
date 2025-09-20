import { Hono } from "hono";
import { connectDB } from "../connect_db";


const app = new Hono();

// app.get('/db', async (res) => {
//     try {
//         await connectDB();
//         const data = connectDB;
//         return res.json({
//             message: "database connection successfully",
//             data: data
//         }, 200);
//     } catch (error) {
//         console.error('Database error:', error);
//         return res.json({
//             error: error instanceof Error ? error.message : 'Unknown error occurred'
//         }, 500);
//     }
// });

// app.get('/start', (res) => res.text('Hello Bun!'));




// เพิ่ม Users
app.post('/create-user', async (c) => {
    try {
        const db = await connectDB();
        const usersCollection = db.collection('users'); 
        const body = await c.req.json();
        
        if (!body.name || !body.email || !body.password) {
            return c.json({
                error: "Name, email, and password are required"
            }, 400);
        }
        const hashedPassword = await Bun.password.hash(body.password);

        const newUser = {
            name: body.name,
            email: body.email,
            phone: body.phone || null,
            role: body.role || 'user',
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const existingUser = await usersCollection.findOne({ email: body.email });
        
        if (existingUser) {
            return c.json({
                error: "Email already exists"
            }, 409);
        }

        const result = await usersCollection.insertOne(newUser);

        return c.json({
            message: "User created successfully",
            data: {
                insertedId: result.insertedId,
                user: {
                    _id: result.insertedId,
                    name: newUser.name,
                    email: newUser.email,
                    phone: newUser.phone,
                    role: newUser.role,
                    createdAt: newUser.createdAt,
                    updatedAt: newUser.updatedAt
                }
            }
        }, 201);

    } catch (error) {
        console.error('Create user error:', error);
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, 500);
    }
});


app.get('/user/:id', async (c) => {
    try {
        const db = await connectDB();
        const usersCollection = db.collection('users');
        const id = c.req.param('id');
        const { ObjectId } = require('mongodb');
        const user = await usersCollection.findOne({ _id: new ObjectId(id) });
        if (!user) {
            return c.json({
                error: "User not found"
            }, 404);
        }

        return c.json({
            message: "User found",
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        }, 200);

    } catch (error) {
        console.error('Get user error:', error);
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, 500);
    }
});


// PUT route - แก้ collection name จาก 'tat_system' เป็น 'users'
app.put('/update/:id', async (c) => {
    try {
        const db = await connectDB();
        const usersCollection = db.collection('users'); // เปลี่ยนจาก 'tat_system'
        
        const id = c.req.param('id');
        const body = await c.req.json();
        
        const { ObjectId } = require('mongodb');
        
        const updateData: any = {
            updatedAt: new Date()
        };

        if (body.name) updateData.name = body.name;
        if (body.email) updateData.email = body.email;
        if (body.phone !== undefined) updateData.phone = body.phone;
        if (body.role) updateData.role = body.role;

        if (body.password) {
            if (body.password.length < 6) {
                return c.json({
                    error: "Password must be at least 6 characters long"
                }, 400);
            }
            updateData.password = await Bun.password.hash(body.password);
        }
        
        const result = await usersCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return c.json({
                error: "User not found"
            }, 404);
        }

        return c.json({
            message: "User updated successfully",
            modifiedCount: result.modifiedCount
        }, 200);

    } catch (error) {
        console.error('Update user error:', error);
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, 500);
    }
});



app.post('/login', async (c) => {
    try {
        const db = await connectDB();
        const usersCollection = db.collection('users');
        const { email, password } = await c.req.json();
        if (!email || !password) {
            return c.json({
                error: "Email and password are required"
            }, 400);
        }
        const user = await usersCollection.findOne({ email });
        if (!user) {
            return c.json({
                error: "Invalid email or password"
            }, 401);
        }
        const isPasswordValid = await Bun.password.verify(password, user.password);   
        if (!isPasswordValid) {
            return c.json({
                error: "Invalid email or password"
            }, 401);
        }
        return c.json({
            message: "Login successful",
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        }, 200);

    } catch (error) {
        console.error('Login error:', error);
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, 500);
    }
});

export default app;