import type { StoredPaymentMethod } from './types';

export const MOCK_PAYMENT_METHODS: StoredPaymentMethod[] = [
  {
    id: "pm_1a2b3c_checking",
    name: "Primary Checking",
    accountNumber: "XXXX1234",
    accountType: "PERSONAL_CHECKING",
    routingNumber: "XXXXX1111",
    default: true,
    created: "2023-01-15T10:00:00Z",
    updated: "2024-03-20T14:30:00Z",
    inputType: "KEYED",
    phone: "5551234567"
  },
  {
    id: "pm_4d5e6f_credit",
    name: "Visa Rewards",
    accountNumber: "XXXX5678",
    accountType: "CREDIT_CARD",
    routingNumber: "N/A",
    default: false,
    created: "2022-11-01T12:00:00Z",
    updated: "2022-11-01T12:00:00Z",
    inputType: "SWIPED",
    phone: "5551234567"
  },
  {
    id: "pm_7g8h9i_savings",
    name: "High-Yield Savings",
    accountNumber: "XXXX9012",
    accountType: "SAVINGS",
    routingNumber: "XXXXX2222",
    default: false,
    created: "2024-01-01T09:00:00Z",
    updated: "2024-01-01T09:00:00Z",
    inputType: "ONLINE",
    phone: "5551234567"
  }
];
