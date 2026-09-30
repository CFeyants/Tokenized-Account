import { JourneyHeader } from '@/components/Journey';
import { JitTab } from '@/screens/Funding';

export function JustInTime() {
  return (
    <div>
      <JourneyHeader id="jit" />
      <JitTab />
    </div>
  );
}
