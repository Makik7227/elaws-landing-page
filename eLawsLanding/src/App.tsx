import {Route, Routes } from 'react-router-dom'
import HomePage from "./pages/HomePage.tsx";
import '../src/App.css'
import Layout from "./components/Layout.tsx";

function App() {

  return (
      <Routes>
          <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
          </Route>
      </Routes>
  )
}

export default App
