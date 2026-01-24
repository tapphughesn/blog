import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Blog from './blog';
import CV from './cv';
import About from './about';
import Publications from './publications';
import BlogPost from './blogpost';
import "./index.css";

/** uncomment when I need to connect a backend */
// import { Amplify } from "aws-amplify";
// import outputs from "../amplify_outputs.json";
// Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<About />} />
          <Route path="cv" element={<CV />} />
          <Route path="publications" element={<Publications />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:title" element={<BlogPost />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
