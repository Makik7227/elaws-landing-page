import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {Provider} from "react-redux";
import {store} from "./store.ts";
import {BrowserRouter} from "react-router-dom";
import {CssBaseline} from "@mui/material";
import {ThemeProvider} from "./theme/ThemeProvider.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <ThemeProvider>
                    <CssBaseline />
                    <App />
                </ThemeProvider>
            </BrowserRouter>
        </Provider>
    </StrictMode>
)
