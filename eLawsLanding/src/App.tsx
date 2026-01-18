import {Route, Routes} from 'react-router-dom'
import HomePage from "./pages/HomePage.tsx";
import '../src/App.css'
import Layout from "./components/Layout.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import SingUp from "./pages/SingUp.tsx";
import FeaturesPage from "./pages/FeaturesPage.tsx";
import PricingPage from "./pages/PricingPage.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import ManageAccount from "./pages/ManageAccount.tsx";
import DashboardView from "./pages/DashboardView.tsx";
import CasesPage from "./pages/CasesPage.tsx";
import AiChatPage from "./pages/AiChatPage.tsx";
import UserChatsWeb from "./pages/UserChats/UserChatsPage.tsx";
import UserChatWeb from "./pages/UserChats/UserChatPage.tsx";
import SavedProceduresPage from "./pages/SavedProceduresPage.tsx";
import ProceduresView from "./pages/ProceduresPage.tsx";
import NotesPage from "./pages/NotesPage.tsx";
import SubscribePage from "./pages/SubscribePage.tsx";
import DocumentsLandingPage from "./pages/DocumentsLandingPage.tsx";
import MyDocumentsPage from "./pages/MyDocumentsPage.tsx";
import GenerateDocumentPage from "./pages/GenerateDocumentPage.tsx";
import CreateCasePage from "./pages/CreateCasePage.tsx";
import ConnectionsPage from "./pages/ConnectionsPage.tsx";
import ContactPage from "./pages/ContactPage.tsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.tsx";

function App() {
    return (
        <Routes>
            <Route element={<Layout/>}>
                <Route path="/" element={<HomePage/>}/>
                <Route path="/home" element={<HomePage/>}/>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
                <Route path="/signup" element={<SingUp/>}/>
                <Route path="/features" element={<FeaturesPage/>}/>
                <Route path="/pricing" element={<PricingPage/>}/>
                <Route path="/about" element={<AboutPage/>}/>
                <Route path="/manage" element={<ManageAccount/>}/>
                <Route path="/dashboard" element={<DashboardView/>}/>
                <Route path="/dashboard/cases" element={<CasesPage/>}/>
                <Route path="/ai/chat" element={<AiChatPage/>}/>
                <Route path="/userChats" element={<UserChatsWeb/>}/>
                <Route path="/userChats/:id" element={<UserChatWeb/>}/>
                <Route path="/cases/create" element={<CreateCasePage/>}/>
                <Route path="/cases/:id" element={<CasesPage/>}/>
                <Route path="/procedures" element={<ProceduresView/>}/>
                <Route path="/dashboard/procedures/saved" element={<SavedProceduresPage/>}/>
                <Route path="/dashboard/notes" element={<NotesPage/>}/>
                <Route path="/dashboard/subscribe" element={<SubscribePage/>}/>
                <Route path="/documents" element={<DocumentsLandingPage/>}/>
                <Route path="/documents/my" element={<MyDocumentsPage/>}/>
                <Route path="/documents/generate" element={<GenerateDocumentPage/>}/>
                <Route path="/connections" element={<ConnectionsPage/>}/>
                <Route path="/contact" element={<ContactPage/>}/>
            </Route>
        </Routes>
    )
}

export default App
