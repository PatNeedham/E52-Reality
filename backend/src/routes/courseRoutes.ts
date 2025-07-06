import express from 'express';
import * as controller from '../controllers/courseController';

const router = express.Router();

// Placeholder for auth middleware
// const auth = (req, res, next) => { req.user = { userId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed' }; next(); };

router.get('/my-library', controller.getUserCourses);
router.post('/', controller.createCourse);
router.get('/:courseId', controller.getCourseById);

router.post('/:courseId/versions', controller.saveCourseVersion);
router.get('/:courseId/history', controller.getCourseHistory);
router.get('/versions/:versionId/data', controller.getCourseVersionData);

router.get('/discover', controller.getPublicCourses);
router.patch('/:courseId/publish', controller.publishCourse);

export default router;
