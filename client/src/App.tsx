import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import SearchPage from "./pages/SearchPage";
import WorkPage from "./pages/WorkPage";
import AssistantPage from "./pages/AssistantPage";
import EntityPage from "./pages/EntityPage";
import ComparePage from "./pages/ComparePage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";
import UniverseMapPage from "./pages/UniverseMapPage";
import NotFound from "./pages/NotFound";

function Router() { return <Switch><Route path="/" component={Home}/><Route path="/search" component={SearchPage}/><Route path="/work/:id" component={WorkPage}/><Route path="/assistant" component={AssistantPage}/><Route path="/entity/:id" component={EntityPage}/><Route path="/compare" component={ComparePage}/><Route path="/settings" component={SettingsPage}/><Route path="/admin" component={AdminPage}/><Route path="/map" component={UniverseMapPage}/><Route path="/404" component={NotFound}/><Route component={NotFound}/></Switch>; }

export default function App() { return <ErrorBoundary><LanguageProvider><ThemeProvider defaultTheme="dark" switchable><TooltipProvider><Toaster/><Router/></TooltipProvider></ThemeProvider></LanguageProvider></ErrorBoundary>; }
