import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/layout/AppShell';
import { Home } from '@/screens/Home';

const load = <K extends string>(p: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(() => p().then((m) => ({ default: m[name] })));

// The six journeys.
const SmartContracts = load(() => import('@/screens/SmartContracts'), 'SmartContracts');
const Repatriation = load(() => import('@/screens/Repatriation'), 'Repatriation');
const Minute = load(() => import('@/screens/Minute'), 'Minute');
const Sweep = load(() => import('@/screens/Sweep'), 'Sweep');
const Approvals = load(() => import('@/screens/Approvals'), 'Approvals');
const Tms = load(() => import('@/screens/Tms'), 'Tms');
const Incidents = load(() => import('@/screens/Incidents'), 'Incidents');
const BusinessCase = load(() => import('@/screens/BusinessCase'), 'BusinessCase');
const PutToWork = load(() => import('@/screens/PutToWork'), 'PutToWork');
const PreValidation = load(() => import('@/screens/PreValidation'), 'PreValidation');
const JustInTime = load(() => import('@/screens/JustInTime'), 'JustInTime');
const UsSurplus = load(() => import('@/screens/UsSurplus'), 'UsSurplus');
const SettleFund = load(() => import('@/screens/SettleFund'), 'SettleFund');
// Everyday banking and the week in detail.
const Week = load(() => import('@/screens/Week'), 'Week');
const Accounts = load(() => import('@/screens/Accounts'), 'Accounts');
const AccountPage = load(() => import('@/screens/AccountPage'), 'AccountPage');
const Payments = load(() => import('@/screens/Payments'), 'Payments');
const Rules = load(() => import('@/screens/Rules'), 'Rules');
const Placements = load(() => import('@/screens/Placements'), 'Placements');
const Guarantees = load(() => import('@/screens/Guarantees'), 'Guarantees');
const Statements = load(() => import('@/screens/Statements'), 'Statements');
const Corridors = load(() => import('@/screens/Corridors'), 'Corridors');
const TourRecap = load(() => import('@/screens/TourRecap'), 'TourRecap');
const About = load(() => import('@/screens/About'), 'About');

const page = (el: React.ReactNode) => <Suspense fallback={null}>{el}</Suspense>;

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <TooltipProvider delayDuration={150}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="smart-contracts" element={page(<SmartContracts />)} />
            <Route path="repatriation" element={page(<Repatriation />)} />
            <Route path="minute" element={page(<Minute />)} />
            <Route path="sweep" element={page(<Sweep />)} />
            <Route path="approvals" element={page(<Approvals />)} />
            <Route path="tms" element={page(<Tms />)} />
            <Route path="incidents" element={page(<Incidents />)} />
            <Route path="business-case" element={page(<BusinessCase />)} />
            <Route path="put-to-work" element={page(<PutToWork />)} />
            <Route path="pre-validation" element={page(<PreValidation />)} />
            <Route path="just-in-time" element={page(<JustInTime />)} />
            <Route path="us-surplus" element={page(<UsSurplus />)} />
            <Route path="settle-fund" element={page(<SettleFund />)} />
            <Route path="week" element={page(<Week />)} />
            <Route path="accounts" element={page(<Accounts />)} />
            <Route path="accounts/:id" element={page(<AccountPage />)} />
            <Route path="payments" element={page(<Payments />)} />
            <Route path="rules" element={page(<Rules />)} />
            <Route path="placements" element={page(<Placements />)} />
            <Route path="guarantees" element={page(<Guarantees />)} />
            <Route path="statements" element={page(<Statements />)} />
            <Route path="corridors" element={page(<Corridors />)} />
            <Route path="tour-recap" element={page(<TourRecap />)} />
            <Route path="about" element={page(<About />)} />
            <Route path="escrow" element={<Navigate to="/smart-contracts" replace />} />
            <Route path="funding" element={<Navigate to="/just-in-time" replace />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  );
}
