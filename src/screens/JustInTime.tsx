import { useSearchParams } from 'react-router-dom';
import { JourneyHeader } from '@/components/Journey';
import { JitTab } from '@/screens/Funding';

export function JustInTime() {
  const [params] = useSearchParams();
  return (
    <div>
      <JourneyHeader id="jit" />
      {/* A new preset (from an alert or the tour) starts a fresh form. */}
      <JitTab key={params.get('preset') ?? 'default'} />
    </div>
  );
}
