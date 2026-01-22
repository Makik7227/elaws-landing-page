import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import "../src/App.css";
import Layout from "./components/Layout.tsx";

const HomePage = lazy(() => import("./pages/HomePage.tsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.tsx"));
const SingUp = lazy(() => import("./pages/SingUp.tsx"));
const FeaturesPage = lazy(() => import("./pages/FeaturesPage.tsx"));
const PricingPage = lazy(() => import("./pages/PricingPage.tsx"));
const AboutPage = lazy(() => import("./pages/AboutPage.tsx"));
const ManageAccount = lazy(() => import("./pages/ManageAccount.tsx"));
const DashboardView = lazy(() => import("./pages/DashboardView.tsx"));
const CasesPage = lazy(() => import("./pages/CasesPage.tsx"));
const AiChatPage = lazy(() => import("./pages/AiChatPage.tsx"));
const UserChatsWeb = lazy(() => import("./pages/UserChats/UserChatsPage.tsx"));
const UserChatWeb = lazy(() => import("./pages/UserChats/UserChatPage.tsx"));
const SavedProceduresPage = lazy(() => import("./pages/SavedProceduresPage.tsx"));
const ProceduresView = lazy(() => import("./pages/ProceduresPage.tsx"));
const NotesPage = lazy(() => import("./pages/NotesPage.tsx"));
const SubscribePage = lazy(() => import("./pages/SubscribePage.tsx"));
const DocumentsLandingPage = lazy(() => import("./pages/DocumentsLandingPage.tsx"));
const MyDocumentsPage = lazy(() => import("./pages/MyDocumentsPage.tsx"));
const GenerateDocumentPage = lazy(() => import("./pages/GenerateDocumentPage.tsx"));
const CreateCasePage = lazy(() => import("./pages/CreateCasePage.tsx"));
const ConnectionsPage = lazy(() => import("./pages/ConnectionsPage.tsx"));
const ContactPage = lazy(() => import("./pages/ContactPage.tsx"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage.tsx"));
const ProceduresPurchaseSuccessPage = lazy(() => import("./pages/ProceduresPurchaseSuccessPage.tsx"));
const ProceduresPurchaseCancelPage = lazy(() => import("./pages/ProceduresPurchaseCancelPage.tsx"));
const ProceduresPurchasePage = lazy(() => import("./pages/ProceduresPurchasePage.tsx"));

function App() {
    return (
        <Suspense fallback={<div />}>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/signup" element={<SingUp />} />
                    <Route path="/features" element={<FeaturesPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/manage" element={<ManageAccount />} />
                    <Route path="/dashboard" element={<DashboardView />} />
                    <Route path="/dashboard/cases" element={<CasesPage />} />
                    <Route path="/ai/chat" element={<AiChatPage />} />
                    <Route path="/userChats" element={<UserChatsWeb />} />
                    <Route path="/userChats/:id" element={<UserChatWeb />} />
                    <Route path="/cases/create" element={<CreateCasePage />} />
                    <Route path="/cases/:id" element={<CasesPage />} />
                    <Route path="/procedures" element={<ProceduresView />} />
                    <Route path="/dashboard/procedures/saved" element={<SavedProceduresPage />} />
                    <Route path="/dashboard/notes" element={<NotesPage />} />
                    <Route path="/dashboard/subscribe" element={<SubscribePage />} />
                    <Route path="/documents" element={<DocumentsLandingPage />} />
                    <Route path="/documents/my" element={<MyDocumentsPage />} />
                    <Route path="/documents/generate" element={<GenerateDocumentPage />} />
                    <Route path="/connections" element={<ConnectionsPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/procedures-purchase/success" element={<ProceduresPurchaseSuccessPage />} />
                    <Route path="/procedures-purchase/cancel" element={<ProceduresPurchaseCancelPage />} />
                    <Route path="/procedures-purchase" element={<ProceduresPurchasePage />} />
                </Route>
            </Routes>
        </Suspense>
    );
}

export default App
