import { ApiKeyItem, Project } from '@/types';

export const INITIAL_DEMO_PROJECTS: Project[] = [
  {
    id: 'proj-scraping',
    name: 'Scraping & Automation Pipeline',
    description: 'High-volume data scraping bots with TikHub and 2Captcha solvers',
    color: '#06b6d4',
    icon: 'Bot',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString()
  },
  {
    id: 'proj-ai-agent',
    name: 'AI Agent & Copilot Backend',
    description: 'Autonomous orchestration using OpenAI GPT-4o, Claude 3.5 Sonnet, and Groq',
    color: '#8b5cf6',
    icon: 'Sparkles',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
  },
  {
    id: 'proj-growth',
    name: 'SEO & Intelligence Engine',
    description: 'Social listening and sentiment analysis with DeepSeek and secondary scrapers',
    color: '#10b981',
    icon: 'TrendingUp',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
  }
];

export const INITIAL_DEMO_KEYS: ApiKeyItem[] = [
  // Keys for proj-scraping
  {
    id: 'demo-tikhub-1',
    projectId: 'proj-scraping',
    providerId: 'tikhub',
    label: 'TikTok Scraper Production (US-East)',
    apiKey: 'th-live_948af20b6e11894d32098c',
    maskedKey: 'th-live_••••••••••••098c',
    balance: 14.85,
    maxQuota: 20.00,
    used: 5.15,
    currency: '$',
    status: 'healthy',
    alertThreshold: 2.00,
    lastChecked: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    expiry: '2026-12-31',
    notes: 'Handles 100k daily video metric extractions'
  },
  {
    id: 'demo-twocaptcha-1',
    projectId: 'proj-scraping',
    providerId: 'twocaptcha',
    label: 'Cloudflare Solvers Pool',
    apiKey: '2c_88bf20a990e118274d812',
    maskedKey: '2c_••••••••••••d812',
    balance: 8.90,
    maxQuota: 10.00,
    used: 1.10,
    currency: '$',
    status: 'healthy',
    alertThreshold: 1.00,
    lastChecked: new Date(Date.now() - 1000 * 60 * 19).toISOString(),
    expiry: 'Permanent',
    notes: 'Auto-refill triggered when < $1.00'
  },
  {
    id: 'demo-tikhub-2',
    projectId: 'proj-scraping',
    providerId: 'tikhub',
    label: 'Instagram Media Downloader',
    apiKey: 'th-live_1102948bbcaef82049e',
    maskedKey: 'th-live_••••••••••••049e',
    balance: 0.12,
    maxQuota: 15.00,
    used: 14.88,
    currency: '$',
    status: 'danger',
    alertThreshold: 1.50,
    lastChecked: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    expiry: '2026-10-31',
    notes: 'Critical: Key depleted, scraper paused'
  },

  // Keys for proj-ai-agent
  {
    id: 'demo-openai-1',
    projectId: 'proj-ai-agent',
    providerId: 'openai',
    label: 'GPT-4o Copilot Agent',
    apiKey: 'sk-proj-7a91bf902d18400192eab81',
    maskedKey: 'sk-proj-••••••••••••ab81',
    balance: 1.45,
    maxQuota: 50.00,
    used: 48.55,
    currency: '$',
    status: 'warning',
    alertThreshold: 3.00,
    lastChecked: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    expiry: '2026-11-01',
    notes: 'Warning: balance is under threshold ($3.00)'
  },
  {
    id: 'demo-anthropic-1',
    projectId: 'proj-ai-agent',
    providerId: 'anthropic',
    label: 'Claude 3.5 Coding Assistant',
    apiKey: 'sk-ant-api03-9184ba00293ee190a4',
    maskedKey: 'sk-ant-••••••••••••0a4',
    balance: 42.10,
    maxQuota: 100.00,
    used: 57.90,
    currency: '$',
    status: 'healthy',
    alertThreshold: 10.00,
    lastChecked: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    expiry: '2026-11-30',
    notes: 'Used in IDE and CI test suite'
  },
  {
    id: 'demo-groq-1',
    projectId: 'proj-ai-agent',
    providerId: 'groq',
    label: 'Llama 3.3 70B Realtime API',
    apiKey: 'gsk_772819001ae88390bca2',
    maskedKey: 'gsk_••••••••••••bca2',
    balance: 19.50,
    maxQuota: 25.00,
    used: 5.50,
    currency: '$',
    status: 'healthy',
    alertThreshold: 2.00,
    lastChecked: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    expiry: '2026-12-15',
    notes: 'Sub-200ms latency stream generation'
  },

  // Keys for proj-growth
  {
    id: 'demo-deepseek-1',
    projectId: 'proj-growth',
    providerId: 'deepseek',
    label: 'DeepSeek-V3 Reasoning',
    apiKey: 'sk-9988220011aebc890123ef',
    maskedKey: 'sk-••••••••••••23ef',
    balance: 16.40,
    maxQuota: 25.00,
    used: 8.60,
    currency: '$',
    status: 'healthy',
    alertThreshold: 2.00,
    lastChecked: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    expiry: '2026-12-31',
    notes: 'Sentiment classification batch job'
  }
];
