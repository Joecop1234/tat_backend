import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { connectDB } from "../connect_db";

const app = new Hono();

// ตรวจสอบการเชื่อมต่อ MongoDB
const getTasksCollection = async () => {
  const db = await connectDB();
  return db.collection('tasks');
};

// ตรวจสอบ ObjectId
const isValidObjectId = (id: string): boolean => {
  return ObjectId.isValid(id);
};

// Interface สำหรับ Task
interface Task {
  _id?: ObjectId;
  task_title: string;
  task_description?: string;
  project_id: string;
  assigned_to?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  due_date?: Date;
  estimated_hours?: number;
  actual_hours?: number;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

// POST /tasks - สร้างงานใหม่ในโปรเจกต์ (แบบง่าย ไม่ต้อง auth)
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const {
      task_title,
      task_description,
      project_id,
      assigned_to,
      status = 'TODO',
      priority = 'MEDIUM',
      due_date,
      estimated_hours
    } = body;

    // ตรวจสอบข้อมูลพื้นฐาน
    if (!task_title || !project_id) {
      return c.json({
        success: false,
        message: 'Task title and project ID are required'
      }, 400);
    }

    // ตรวจสอบ project_id เป็น ObjectId ที่ถูกต้อง
    if (!isValidObjectId(project_id)) {
      return c.json({
        success: false,
        message: 'Invalid project ID format'
      }, 400);
    }

    // ตรวจสอบ assigned_to ถ้ามี
    if (assigned_to && !isValidObjectId(assigned_to)) {
      return c.json({
        success: false,
        message: 'Invalid assigned user ID format'
      }, 400);
    }

    // ตรวจสอบ due_date ถ้ามี
    let dueDate;
    if (due_date) {
      dueDate = new Date(due_date);
      if (isNaN(dueDate.getTime())) {
        return c.json({
          success: false,
          message: 'Invalid due date format'
        }, 400);
      }
    }

    const collection = await getTasksCollection();

    // สร้างงานใหม่
    const newTask: Task = {
      task_title,
      task_description: task_description || '',
      project_id,
      assigned_to: assigned_to || '',
      status,
      priority,
      due_date: dueDate,
      estimated_hours: estimated_hours || null,
      actual_hours: 0,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'system'
    };

    const result = await collection.insertOne(newTask);

    if (result.acknowledged) {
      const createdTask = await collection.findOne({ _id: result.insertedId });
      
      return c.json({
        success: true,
        message: 'Task created successfully',
        data: createdTask
      }, 201);
    } else {
      return c.json({
        success: false,
        message: 'Failed to create task'
      }, 500);
    }
  } catch (error) {
    console.error('Create task error:', error);
    return c.json({
      success: false,
      message: 'Internal server error'
    }, 500);
  }
});

// PUT /tasks/:id - อัปเดตสถานะของงาน (แบบง่าย)
app.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const {
      task_title,
      task_description,
      assigned_to,
      status,
      priority,
      due_date,
      estimated_hours,
      actual_hours
    } = body;

    // ตรวจสอบ ObjectId
    if (!isValidObjectId(id)) {
      return c.json({
        success: false,
        message: 'Invalid task ID format'
      }, 400);
    }

    const collection = await getTasksCollection();

    // ตรวจสอบว่างานมีอยู่จริง
    const existingTask = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingTask) {
      return c.json({
        success: false,
        message: 'Task not found'
      }, 404);
    }

    const updateData: any = {
      updated_at: new Date()
    };

    // อัปเดตเฉพาะฟิลด์ที่ส่งมา
    if (task_title) updateData.task_title = task_title;
    if (task_description !== undefined) updateData.task_description = task_description;
    
    if (assigned_to) {
      if (!isValidObjectId(assigned_to)) {
        return c.json({
          success: false,
          message: 'Invalid assigned user ID format'
        }, 400);
      }
      updateData.assigned_to = assigned_to;
    }

    if (status) {
      const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return c.json({
          success: false,
          message: 'Invalid task status'
        }, 400);
      }
      updateData.status = status;
    }

    if (priority) {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      if (!validPriorities.includes(priority)) {
        return c.json({
          success: false,
          message: 'Invalid task priority'
        }, 400);
      }
      updateData.priority = priority;
    }

    if (due_date) {
      const dueDate = new Date(due_date);
      if (isNaN(dueDate.getTime())) {
        return c.json({
          success: false,
          message: 'Invalid due date format'
        }, 400);
      }
      updateData.due_date = dueDate;
    }

    if (estimated_hours !== undefined) {
      updateData.estimated_hours = estimated_hours;
    }

    if (actual_hours !== undefined) {
      updateData.actual_hours = actual_hours;
    }

    // อัปเดตข้อมูล
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return c.json({
        success: false,
        message: 'Task not found'
      }, 404);
    }

    // ดึงข้อมูลที่อัปเดตแล้ว
    const updatedTask = await collection.findOne({ _id: new ObjectId(id) });

    return c.json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    return c.json({
      success: false,
      message: 'Internal server error'
    }, 500);
  }
});

// GET /tasks - ดึงงานทั้งหมด
app.get('/', async (c) => {
  try {
    const query = c.req.query();
    const { project_id, assigned_to, status, priority, page = '1', limit = '10' } = query;
    
    const filter: any = {};
    if (project_id && isValidObjectId(project_id)) {
      filter.project_id = project_id;
    }
    if (assigned_to && isValidObjectId(assigned_to)) {
      filter.assigned_to = assigned_to;
    }
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    // คำนวณการแบ่งหน้า
    const skip = (Number(page) - 1) * Number(limit);
    
    const collection = await getTasksCollection();
    
    // ดึงข้อมูลพร้อมแบ่งหน้า
    const tasks = await collection
      .find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(Number(limit))
      .toArray();
    const totalCount = await collection.countDocuments(filter);
    
    return c.json({
      success: true,
      message: 'Tasks retrieved successfully',
      data: {
        tasks,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / Number(limit)),
          totalItems: totalCount,
          itemsPerPage: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all tasks error:', error);
    return c.json({
      success: false,
      message: 'Internal server error'
    }, 500);
  }
});





export default app;