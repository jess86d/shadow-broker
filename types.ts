export enum Tool {
  ShadowScribe = 'SHADOW_SCRIBE',
  AbyssalVision = 'ABYSSAL_VISION',
  CodeWeaver = 'CODE_WEAVER',
  SpecterSentinel = 'SPECTER_SENTINEL',
  ShadowCrawler = 'SHADOW_CRAWLER',
  OsintHarbinger = 'OSINT_HARBINGER',
  AbyssalLedger = 'ABYSSAL_LEDGER',
}

export interface SocialProfileResult {
    url: string;
    found: boolean;
}

export interface OsintReport {
    target: string;
    google_search: {
        search_url: string;
        summary: string;
        error: string | null;
    };
    domain_info: {
        status: string;
        whois_data: {
            organization: string | null;
            creation_date: string | null;
            expiration_date: string | null;
            name_servers: string[] | null;
        } | null;
        error: string | null;
    };
    social_media_presence: {
        profiles: {
            [key: string]: SocialProfileResult;
        };
    };
}


export interface DynamicRulePattern {
  id: string;
  transaction_type: string;
  min_amount: number;
  description_keywords: string;
}

export interface DynamicRules {
  badIps: string[];
  keywords: string[];
  patterns: DynamicRulePattern[];
}

export interface TransactionAnalysis {
    ml_fraud_proba: number;
    is_anomaly: boolean;
    rule_based_fraud: boolean;
    triggered_rules: string[];
    final_decision: boolean;
    summary: string;
}

export interface CrawlResult {
  original_url: string;
  final_url: string;
  status_code: number;
  content_length: number;
  content_preview: string;
  error_message: string | null;
  proxy_location?: string | null;
}

export interface PaymentDetails {
    amount: number;
    customerId: string;
    paymentMethodId: string;
    invoiceId?: string;
    privateNote?: string;
}

export interface PaymentResult {
    status: 'success' | 'error';
    message: string;
    details?: string;
    payment?: {
        id: string;
        amount: number;
        customerId: string;
        created_at: string;
    };
}

export interface StoredPaymentMethod {
    id: string;
    name: string;
    accountNumber: string; // e.g., "XXXX4534"
    accountType: string;   // e.g., "PERSONAL_CHECKING"
    routingNumber: string; // e.g., "XXXXX0358"
    default: boolean;
    created: string; // ISO date string
    updated: string; // ISO date string
    inputType: string; // e.g., "KEYED"
    phone: string;
}

export interface CodeFile {
  name: string;
  content: string;
  language: string;
}