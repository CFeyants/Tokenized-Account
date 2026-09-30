import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/layout/AppShell';
import { Home } from '@/screens/Home';
import { Accounts } from '@/screens/Accounts';
import { AccountPage } from '@/screens/AccountPage';
import { Payments } from '@/screens/Payments';
import { Rules } from '@/screens/Rules';
import { Placements } from '@/screens/Placements';
import { Guarantees } from '@/screens/Guarantees';
import { Statements } from '@/screens/Statements';
import { About } from '@/screens/About';

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <TooltipProvider delayDuration={150}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="accounts/:id" element={<AccountPage />} />
            <Route path="payments" element={<Payments />} />
            <Route path="rules" element={<Rules />} />
            <Route path="placements" element={<Placements />} />
            <Route path="guarantees" element={<Guarantees />} />
            <Route path="statements" element={<Statements />} />
            <Route path="about" element={<About />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  );
}
