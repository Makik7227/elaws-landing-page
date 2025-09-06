import {Route, Routes } from 'react-router-dom'
import HomePage from "./pages/HomePage.tsx";
import '../src/App.css'
import Layout from "./components/Layout.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import SingUp from "./pages/SingUp.tsx";
import FeaturesPage from "./pages/FeaturesPage.tsx";
import PricingPage from "./pages/PricingPage.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import ManageAccount from "./pages/ManageAccount.tsx";

function App() {

  return (
      <Routes>
          <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage/>} />
              <Route path="/signup" element={<SingUp/>}/>
              <Route path="/features" element={<FeaturesPage/>}/>
              <Route path="/pricing" element={<PricingPage/>}/>
              <Route path="/about" element={<AboutPage/>}/>
              <Route path="/manage" element={<ManageAccount/>}/>
          </Route>
      </Routes>
  )
}

export default App
