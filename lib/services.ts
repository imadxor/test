export interface Service {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export const SERVICES: Service[] = [
  {
    id: 'whatsapp-marketing',
    label: 'WhatsApp Marketing',
    description: 'Trigger bulk WhatsApp broadcasts from a Google Sheet.',
    enabled: true,
  },
  {
    id: 'shipping',
    label: 'Shipping',
    description: 'Track and manage order shipments.',
    enabled: false,
  },
  {
    id: 'whatsapp-automation',
    label: 'WhatsApp Order Automation',
    description: 'Automated WhatsApp order confirmations and status updates.',
    enabled: false,
  },
];
