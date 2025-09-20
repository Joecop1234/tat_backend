import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { connectDB } from "../connect_db";

const app = new Hono();

// ตรวจสอบการเชื่อมต่อ MongoDB
const getProjectsCollection = async () => {
  const db = await connectDB();
  return db.collection('projects');
};

// ตรวจสอบ ObjectId
const isValidObjectId = (id: string): boolean => {
  return ObjectId.isValid(id);
};

// Interface สำหรับ Project
interface Project {
  _id?: ObjectId;
  project_name: string;
  description?: string;
  leader_id: string;
  start_date: Date;
  end_date?: Date;
  budget?: number;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

// GET /projects - ดึงข้อมูลโปรเจกต์ทั้งหมด
app.get('/', async (c) => {
  try {
    const collection = await getProjectsCollection();
    const query = c.req.query();
    const { status, leader_id, page = '1', limit = '10' } = query;
    
    const filter: any = {};
    if (status) filter.status = status;
    if (leader_id && isValidObjectId(leader_id)) {
      filter.leader_id = leader_id;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const projects = await collection
      .find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(Number(limit))
      .toArray();
    const totalCount = await collection.countDocuments(filter);
    
    return c.json({
      success: true,
      message: 'Projects retrieved successfully',
      data: {
        projects,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / Number(limit)),
          totalItems: totalCount,
          itemsPerPage: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all projects error:', error);
    return c.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /projects - สร้างโปรเจกต์ใหม่
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const {
      project_name,
      description,
      leader_id,
      start_date,
      end_date,
      budget,
      status = 'PLANNING'
    } = body;
    if (!project_name || !start_date) {
      return c.json({
        success: false,
        message: 'Project name and start date are required'
      }, 400);
    }
    const startDate = new Date(start_date);
    if (isNaN(startDate.getTime())) {
      return c.json({
        success: false,
        message: 'Invalid start date format'
      }, 400);
    }

    let endDate;
    if (end_date) {
      endDate = new Date(end_date);
      if (isNaN(endDate.getTime())) {
        return c.json({
          success: false,
          message: 'Invalid end date format'
        }, 400);
      }

      if (endDate <= startDate) {
        return c.json({
          success: false,
          message: 'End date must be after start date'
        }, 400);
      }
    }

    const collection = await getProjectsCollection();

    // ตรวจสอบชื่อโปรเจกต์ซ้ำ
    const existingProject = await collection.findOne({ project_name });
    if (existingProject) {
      return c.json({
        success: false,
        message: 'Project name already exists'
      }, 400);
    }
    const newProject: Project = {
      project_name,
      description: description || '',
      leader_id: leader_id || '',
      start_date: startDate,
      end_date: endDate,
      budget: budget || null,
      status,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'system'
    };

    const result = await collection.insertOne(newProject);

    if (result.acknowledged) {
      const createdProject = await collection.findOne({ _id: result.insertedId });
      
      return c.json({
        success: true,
        message: 'Project created successfully',
        data: createdProject
      }, 201);
    } else {
      return c.json({
        success: false,
        message: 'Failed to create project'
      }, 500);
    }
  } catch (error) {
    console.error('Create project error:', error);
    return c.json({
      success: false,
      message: 'Internal server error'
    }, 500);
  }
});

// GET /projects/:id - ดึงข้อมูลโปรเจกต์เฉพาะ
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!isValidObjectId(id)) {
      return c.json({
        success: false,
        message: 'Invalid project ID format'
      }, 400);
    }

    const collection = await getProjectsCollection();
    const project = await collection.findOne({ _id: new ObjectId(id) });

    if (!project) {
      return c.json({
        success: false,
        message: 'Project not found'
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Project found',
      data: project
    });
  } catch (error) {
    console.error('Get project by ID error:', error);
    return c.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});



export default app;