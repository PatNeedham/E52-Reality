import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './services/opentelemetry';
import './i18n/config';
import './index.css';
import App from './App';
import HomePage from './pages/HomePage';
import MyLibrary from './pages/MyLibrary';
import CourseHistory from './pages/CourseHistory';
import Discover from './pages/Discover';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'library',
        element: <MyLibrary />,
      },
      {
        path: 'course/:courseId/history',
        element: <CourseHistory />,
      },
      {
        path: 'discover',
        element: <Discover />,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <React.Suspense fallback='loading...'>
      <RouterProvider router={router} />
    </React.Suspense>
  </React.StrictMode>
);
