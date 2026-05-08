import { Metadata } from 'next';
import { SignalTowerClient } from './SignalTowerClient';

export const metadata: Metadata = {
  title: 'Signal Tower | TapOK',
  description: 'Transmit malfunctions or suggest upgrades to the TapOK mission grid.',
};

export default function SignalTowerPage() {
  return <SignalTowerClient />;
}
