export const ACCOUNTS = [
  { id: 'bagzland', label: 'Bagzland Store', phoneNumberId: '1047749771762137' },
  { id: 'luxmontre', label: 'Lux Montre Shop', phoneNumberId: 'TODO' },
] as const;

export type Account = (typeof ACCOUNTS)[number];
export type AccountId = Account['id'];
