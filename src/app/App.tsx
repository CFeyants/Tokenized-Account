import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/layout/AppShell';
import { Home } from '@/screens/Home';

// Screens other than the cockpit load on demand; charts come only with the account pages.
const Accounts = lazy(() => import('@/screens/Accounts').then((m) => ({ default: m.Accounts })));
const AccountPage = lazy(() =>
  import('@/screens/AccountPage').then((m) => ({ default: m.AccountPage })),
);
const Payments = lazy(() => import('@/screens/Payments').then((m) => ({ default: m.Payments })));
const Rules = lazy(() => import('@/screens/Rules').then((m) => ({ default: m.Rules })));
const Placements = lazy(() =>
  import('@/screens/Placements').then((m) => ({ default: m.Placements })),
);
const Guarantees = lazy(() =>
  import('@/screens/Guarantees').then((m) => ({ default: m.Guarantees })),
);
const Statements = lazy(() =>
  import('@/screens/Statements').then((m) => ({ default: m.Statements })),
);
const Minute = lazy(() => import('@/screens/Minute').then((m) => ({ default: m.Minute })));
const Funding = lazy(() => import('@/screens/Funding').then((m) => ({ default: m.Funding })));
const About = lazy(() => import('@/screens/About').then((m) => ({ default: m.About })));

const page = (el: React.ReactNode) => <Suspense fallback={null}>{el}</Suspense>;

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <TooltipProvider delayDuration={150}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="accounts" element={page(<Accounts />)} />
            <Route path="accounts/:id" element={page(<AccountPage />)} />
            <Route path="minute" element={page(<Minute />)} />
            <Route path="payments" element={page(<Payments />)} />
            <Route path="rules" element={page(<Rules />)} />
            <Route path="placements" element={page(<Placements />)} />
            <Route path="guarantees" element={page(<Guarantees />)} />
            <Route path="statements" element={page(<Statements />)} />
            <Route path="funding" element={page(<Funding />)} />
            <Route path="about" element={page(<About />)} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  );
}
