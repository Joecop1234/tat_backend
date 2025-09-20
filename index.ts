import { Hono } from "hono";
import UserController from './controllers/UserController';
import ProjectController from './controllers/ProjectController';

const app = new Hono();


app.route('/api/users',UserController);
app.route('/api/prjects',ProjectController);
export default {
    port: 3000,
    fetch: app.fetch,
};