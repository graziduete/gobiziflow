// Configuração OAuth 2.0 para Ellevo
export interface EllevoOAuthConfig {
  clientId: string;
  clientSecret: string;
  subdomain: string;
  service: string;
  redirectUri?: string;
  scope?: string[];
}

// Configuração para diferentes ambientes
export const ELLEVO_OAUTH_CONFIGS = {
  development: {
    clientId: process.env.ELLEVO_DEV_CLIENT_ID || 'DEV_CLIENT_ID',
    clientSecret: process.env.ELLEVO_DEV_CLIENT_SECRET || 'DEV_CLIENT_SECRET',
    subdomain: 'dev',
    service: 'ABRIRCHAMADOPARARPA-638739843601',
    redirectUri: 'http://localhost:3000/auth/ellevo/callback',
    scope: ['tickets:read', 'tickets:write']
  },
  
  staging: {
    clientId: process.env.ELLEVO_STAGING_CLIENT_ID || 'STAGING_CLIENT_ID',
    clientSecret: process.env.ELLEVO_STAGING_CLIENT_SECRET || 'STAGING_CLIENT_SECRET',
    subdomain: 'staging',
    service: 'ABRIRCHAMADOPARARPA-638739843601',
    redirectUri: 'https://staging.seudominio.com/auth/ellevo/callback',
    scope: ['tickets:read', 'tickets:write']
  },
  
  production: {
    clientId: process.env.ELLEVO_PROD_CLIENT_ID || 'PROD_CLIENT_ID',
    clientSecret: process.env.ELLEVO_PROD_CLIENT_SECRET || 'PROD_CLIENT_SECRET',
    subdomain: 'copersucar',
    service: 'ABRIRCHAMADOPARARPA-638739843601',
    redirectUri: 'https://seudominio.com/auth/ellevo/callback',
    scope: ['tickets:read', 'tickets:write']
  }
};

// Função para obter configuração baseada no ambiente
export function getEllevoOAuthConfig(environment: keyof typeof ELLEVO_OAUTH_CONFIGS): EllevoOAuthConfig {
  return ELLEVO_OAUTH_CONFIGS[environment];
}

// Validação de configuração
export function validateOAuthConfig(config: EllevoOAuthConfig): boolean {
  return !!(
    config.clientId &&
    config.clientSecret &&
    config.subdomain &&
    config.clientId !== 'DEV_CLIENT_ID' &&
    config.clientSecret !== 'DEV_CLIENT_SECRET'
  );
}