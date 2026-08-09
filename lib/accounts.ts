export const ACCOUNTS = [
  {
    id: 'bagzland',
    label: 'Bagzland',
    phoneNumberId: '1047749771762137',
    wabaId: '1711146716905854',
    cardColor: '#b1783f',
    logo: '/logos/bagzland.png',
  },
] as const;

export type Account = (typeof ACCOUNTS)[number];
export type AccountId = Account['id'];
