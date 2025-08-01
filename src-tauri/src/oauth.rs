// 🎓 TEACHING: OAuth 2.0 Implementation for Phase 2
// This module handles OAuth 2.0 flows including Authorization Code and Client Credentials

use anyhow::Result;
use base64::{engine::general_purpose, Engine as _};
use oauth2::{
    basic::BasicClient, AuthUrl, AuthorizationCode, ClientId, ClientSecret, CsrfToken,
    PkceCodeChallenge, PkceCodeVerifier, RedirectUrl, TokenResponse, TokenUrl,
};
use rand::{distributions::Alphanumeric, Rng};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use url::Url;

// 🎓 TEACHING: OAuth 2.0 Token structure
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OAuthToken {
    pub access_token: String,
    pub token_type: String,
    pub expires_in: Option<u64>,
    pub refresh_token: Option<String>,
    pub scope: Option<String>,
}

// 🎓 TEACHING: OAuth 2.0 Configuration
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OAuthConfig {
    pub client_id: String,
    pub client_secret: Option<String>, // Optional for PKCE flows
    pub authorization_url: String,
    pub token_url: String,
    pub redirect_uri: String,
    pub scope: Option<String>,
    pub use_pkce: bool, // PKCE (Proof Key for Code Exchange) for security
}

// 🎓 TEACHING: OAuth 2.0 Manager struct
pub struct OAuthManager {
    pub config: OAuthConfig,
    pub pkce_verifier: Option<PkceCodeVerifier>,
    pub csrf_token: Option<CsrfToken>,
}

impl OAuthManager {
    // 🎓 TEACHING: Create a new OAuth manager
    pub fn new(config: OAuthConfig) -> Self {
        Self {
            config,
            pkce_verifier: None,
            csrf_token: None,
        }
    }

    // 🎓 TEACHING: Generate OAuth 2.0 Authorization URL (Step 1)
    // This creates the URL the user needs to visit to authorize the application
    pub fn get_authorization_url(&mut self) -> Result<String> {
        let client = BasicClient::new(
            ClientId::new(self.config.client_id.clone()),
            self.config.client_secret.as_ref().map(|s| ClientSecret::new(s.clone())),
            AuthUrl::new(self.config.authorization_url.clone())?,
            Some(TokenUrl::new(self.config.token_url.clone())?),
        )
        .set_redirect_uri(RedirectUrl::new(self.config.redirect_uri.clone())?);

        let mut auth_request = client.authorize_url(CsrfToken::new_random);

        // Add scope if provided
        if let Some(scope) = &self.config.scope {
            let scopes: Vec<_> = scope.split(' ').map(|s| oauth2::Scope::new(s.to_string())).collect();
            auth_request = auth_request.add_scopes(scopes);
        }

        // 🎓 TEACHING: PKCE (Proof Key for Code Exchange) for enhanced security
        // This is especially important for public clients and mobile apps
        if self.config.use_pkce {
            let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();
            self.pkce_verifier = Some(pkce_verifier);
            auth_request = auth_request.set_pkce_challenge(pkce_challenge);
        }

        let (auth_url, csrf_token) = auth_request.url();
        self.csrf_token = Some(csrf_token);

        Ok(auth_url.to_string())
    }

    // 🎓 TEACHING: Exchange authorization code for access token (Step 2)
    // This is called after the user authorizes and returns with the code
    pub async fn exchange_code_for_token(
        &self,
        authorization_code: &str,
        csrf_token: &str,
    ) -> Result<OAuthToken> {
        // Verify CSRF token to prevent attacks
        if let Some(stored_csrf) = &self.csrf_token {
            if stored_csrf.secret() != csrf_token {
                return Err(anyhow::anyhow!("CSRF token mismatch"));
            }
        }

        let client = BasicClient::new(
            ClientId::new(self.config.client_id.clone()),
            self.config.client_secret.as_ref().map(|s| ClientSecret::new(s.clone())),
            AuthUrl::new(self.config.authorization_url.clone())?,
            Some(TokenUrl::new(self.config.token_url.clone())?),
        )
        .set_redirect_uri(RedirectUrl::new(self.config.redirect_uri.clone())?);

        let mut token_request = client.exchange_code(AuthorizationCode::new(authorization_code.to_string()));

        // Add PKCE verifier if using PKCE
        if let Some(pkce_verifier) = self.pkce_verifier.as_ref() {
            token_request = token_request.set_pkce_verifier(PkceCodeVerifier::new(pkce_verifier.secret().clone()));
        }

        let token_result = token_request.request_async(oauth2::reqwest::async_http_client).await?;

        Ok(OAuthToken {
            access_token: token_result.access_token().secret().clone(),
            token_type: "Bearer".to_string(),
            expires_in: token_result.expires_in().map(|d| d.as_secs()),
            refresh_token: token_result.refresh_token().map(|t| t.secret().clone()),
            scope: token_result.scopes().map(|scopes| {
                scopes.iter().map(|s| s.as_str()).collect::<Vec<_>>().join(" ")
            }),
        })
    }

    // 🎓 TEACHING: Client Credentials Flow (Machine-to-Machine)
    // This is used when the application needs to access its own resources
    pub async fn client_credentials_flow(&self) -> Result<OAuthToken> {
        let client_secret = self.config.client_secret.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Client secret required for client credentials flow"))?;

        let client = BasicClient::new(
            ClientId::new(self.config.client_id.clone()),
            Some(ClientSecret::new(client_secret.clone())),
            AuthUrl::new(self.config.authorization_url.clone())?,
            Some(TokenUrl::new(self.config.token_url.clone())?),
        );

        let mut token_request = client.exchange_client_credentials();

        // Add scope if provided
        if let Some(scope) = &self.config.scope {
            let scopes: Vec<_> = scope.split(' ').map(|s| oauth2::Scope::new(s.to_string())).collect();
            token_request = token_request.add_scopes(scopes);
        }

        let token_result = token_request.request_async(oauth2::reqwest::async_http_client).await?;

        Ok(OAuthToken {
            access_token: token_result.access_token().secret().clone(),
            token_type: "Bearer".to_string(),
            expires_in: token_result.expires_in().map(|d| d.as_secs()),
            refresh_token: token_result.refresh_token().map(|t| t.secret().clone()),
            scope: token_result.scopes().map(|scopes| {
                scopes.iter().map(|s| s.as_str()).collect::<Vec<_>>().join(" ")
            }),
        })
    }

    // 🎓 TEACHING: Refresh Access Token
    // This renews an expired access token using the refresh token
    pub async fn refresh_token(&self, refresh_token: &str) -> Result<OAuthToken> {
        let client_secret = self.config.client_secret.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Client secret required for token refresh"))?;

        let client = BasicClient::new(
            ClientId::new(self.config.client_id.clone()),
            Some(ClientSecret::new(client_secret.clone())),
            AuthUrl::new(self.config.authorization_url.clone())?,
            Some(TokenUrl::new(self.config.token_url.clone())?),
        );

        let token_result = client
            .exchange_refresh_token(&oauth2::RefreshToken::new(refresh_token.to_string()))
            .request_async(oauth2::reqwest::async_http_client)
            .await?;

        Ok(OAuthToken {
            access_token: token_result.access_token().secret().clone(),
            token_type: "Bearer".to_string(),
            expires_in: token_result.expires_in().map(|d| d.as_secs()),
            refresh_token: token_result.refresh_token().map(|t| t.secret().clone()).or_else(|| Some(refresh_token.to_string())),
            scope: token_result.scopes().map(|scopes| {
                scopes.iter().map(|s| s.as_str()).collect::<Vec<_>>().join(" ")
            }),
        })
    }
}

// 🎓 TEACHING: Utility functions for PKCE (if needed for custom implementations)

// Generate a random code verifier for PKCE
#[allow(dead_code)]
pub fn generate_code_verifier() -> String {
    rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(128)
        .map(char::from)
        .collect()
}

// Generate code challenge from verifier
#[allow(dead_code)]
pub fn generate_code_challenge(verifier: &str) -> String {
    let digest = Sha256::digest(verifier.as_bytes());
    general_purpose::URL_SAFE_NO_PAD.encode(digest)
}

// 🎓 TEACHING: Parse callback URL to extract authorization code and state
pub fn parse_callback_url(callback_url: &str) -> Result<(String, String)> {
    let url = Url::parse(callback_url)?;
    let query_pairs: HashMap<String, String> = url.query_pairs().into_owned().collect();

    let code = query_pairs
        .get("code")
        .ok_or_else(|| anyhow::anyhow!("Authorization code not found in callback URL"))?
        .clone();

    let state = query_pairs
        .get("state")
        .ok_or_else(|| anyhow::anyhow!("State parameter not found in callback URL"))?
        .clone();

    Ok((code, state))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_code_verifier() {
        let verifier = generate_code_verifier();
        assert_eq!(verifier.len(), 128);
        assert!(verifier.chars().all(|c| c.is_alphanumeric()));
    }

    #[test]
    fn test_generate_code_challenge() {
        let verifier = "test_verifier_123";
        let challenge = generate_code_challenge(verifier);
        assert!(!challenge.is_empty());
        // Code challenge should be base64url encoded
        assert!(challenge.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_'));
    }

    #[test]
    fn test_parse_callback_url() {
        let callback_url = "http://localhost:8080/callback?code=auth_code_123&state=csrf_token_456";
        let (code, state) = parse_callback_url(callback_url).unwrap();
        assert_eq!(code, "auth_code_123");
        assert_eq!(state, "csrf_token_456");
    }
}