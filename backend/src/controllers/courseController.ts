import { Request, Response } from 'express';
import db from '../db';

export const getUserCourses = async (req: Request, res: Response) => {
  // const { userId } = req.user; // Assuming auth middleware adds user to req
  const userId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'; // Placeholder
  try {
    const { rows } = await db.query('SELECT * FROM courses WHERE owner_id = $1', [userId]);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getCourseById = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  try {
    const { rows } = await db.query(
      `SELECT c.*, cv.course_data 
       FROM courses c
       LEFT JOIN course_versions cv ON c.current_version_id = cv.id
       WHERE c.id = $1`,
      [courseId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  // const { userId } = req.user;
  const userId = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'; // Placeholder
  try {
    const { rows } = await db.query(
      'INSERT INTO courses (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, userId]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const saveCourseVersion = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { commit_message, course_data } = req.body;

  try {
    const newVersionResult = await db.query(
      'INSERT INTO course_versions (course_id, commit_message, course_data) VALUES ($1, $2, $3) RETURNING id',
      [courseId, commit_message, course_data]
    );
    const newVersionId = newVersionResult.rows[0].id;

    await db.query(
      'UPDATE courses SET current_version_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newVersionId, courseId]
    );

    res.status(201).json({ versionId: newVersionId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getCourseHistory = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  try {
    const { rows } = await db.query(
      'SELECT id, commit_message, created_at FROM course_versions WHERE course_id = $1 ORDER BY created_at DESC',
      [courseId]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getCourseVersionData = async (req: Request, res: Response) => {
  const { versionId } = req.params;
  try {
    const { rows } = await db.query('SELECT course_data FROM course_versions WHERE id = $1', [
      versionId,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Version not found' });
    }
    res.json(rows[0].course_data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const publishCourse = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { is_public, price } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE courses SET is_public = $1, price = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [is_public, price, courseId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getPublicCourses = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query('SELECT * FROM courses WHERE is_public = TRUE');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
