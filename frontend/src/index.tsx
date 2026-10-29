import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './services/opentelemetry';
import './i18n/config';
import App from './App';
import HomePage from './pages/HomePage';
import Landing from './pages/Landing';
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
        element: <Landing />,
      },
      {
        path: 'fly',
        element: <HomePage mode='flight' />,
      },
      {
        path: 'coaster',
        element: <HomePage mode='coaster' />,
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
