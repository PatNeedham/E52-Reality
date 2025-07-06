import 'dotenv/config';
import './opentelemetry';

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import courseRoutes from './routes/courseRoutes';

const app: Application = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('E52 Reality Backend is running!');
});

app.use('/api/courses', courseRoutes);

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
