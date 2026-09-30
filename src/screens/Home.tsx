import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Globe2,
  Landmark,
  Lock,
  ShieldCheck,
  Timer,
  Workflow,
  Zap,
} from 'lucide-react';
import { en } from '@/i18n/en';
import { AccountSummary } from '@/components/AccountSummary';

const J = en.journeys;
const ICONS = {
  contracts: Workflow,
  brazil: Globe2,
  minute: Timer,
  work: Lock,
  prevalidation: ShieldCheck,
  jit: Zap,
};

export function Home() {
  return (
    <div className="space-y-8">
      <div>
        <div className="eyebrow mb-3">{en.home.hello}</div>
        <h1 className="text-[48px] leading-[1.05] tracking-tight">{J.homeTitle}</h1>
        <p className="mt-3 max-w-[640px] text-[16px] leading-relaxed text-muted">{J.homeLead}</p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {J.list.map((j, i) => {
          const Icon = ICONS[j.id];
          return (
            <Link
              key={j.id}
              to={j.path}
              className="card group flex flex-col p-6 transition-colors hover:border-new/50"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-new-soft text-new">
                  <Icon className="size-5" />
                </span>
                <span className="tabular font-serif text-[22px] text-muted">{i + 1}</span>
              </div>
              <h2 className="mt-5 text-[21px] leading-tight">{j.title}</h2>
              <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-muted">{j.promise}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-new">
                {J.start}{' '}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>

      <AccountSummary />

      <Link
        to="/week"
        className="card flex items-center gap-4 p-5 transition-colors hover:border-line-strong"
      >
        <span className="flex size-10 items-center justify-center rounded-xl bg-grey-soft text-muted">
          <Landmark className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block text-[15px] font-medium">{J.more}</span>
          <span className="block text-[12.5px] text-muted">{J.moreHint}</span>
        </span>
        <ArrowRight className="size-4 text-muted" />
      </Link>
    </div>
  );
}
