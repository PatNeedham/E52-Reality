import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

interface Env {
  DB: D1Database;
  NODE_ENV?: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());
app.use('*', logger());

app.get('/', c => {
  return c.text('E52 Reality Backend is running!');
});

app.get('/api/courses', async c => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM courses').all();
    return c.json(results);
  } catch (error) {
    console.error('Database error:', error);
    return c.json({ error: 'Failed to fetch courses' }, 500);
  }
});

app.post('/api/courses', async c => {
  try {
    const body = await c.req.json();
    const { name, points } = body;

    if (!name || !points) {
      return c.json({ error: 'Name and points are required' }, 400);
    }

    const stmt = c.env.DB.prepare('INSERT INTO courses (name, points) VALUES (?, ?)');
    const result = await stmt.bind(name, JSON.stringify(points)).run();

    return c.json(
      {
        id: result.meta.last_row_id,
        name,
        points,
        message: 'Course created successfully',
      },
      201
    );
  } catch (error) {
    console.error('Database error:', error);
    return c.json({ error: 'Failed to create course' }, 500);
  }
});

app.get('/api/courses/:id', async c => {
  try {
    const id = c.req.param('id');
    const { results } = await c.env.DB.prepare('SELECT * FROM courses WHERE id = ?').bind(id).all();

    if (results.length === 0) {
      return c.json({ error: 'Course not found' }, 404);
    }

    return c.json(results[0]);
  } catch (error) {
    console.error('Database error:', error);
    return c.json({ error: 'Failed to fetch course' }, 500);
  }
});

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
