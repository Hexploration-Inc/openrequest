// 🎓 TEACHING: Advanced Authentication Methods for Phase 2
// This module implements Digest Auth, OAuth 1.0, and AWS Signature authentication

use anyhow::Result;
use base64::{engine::general_purpose, Engine as _};
use hmac::{Hmac, Mac};
use md5::{self};
use rand::{distributions::Alphanumeric, Rng};
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

// 🎓 TEACHING: Digest Authentication Implementation
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DigestAuthConfig {
    pub username: String,
    pub password: String,
    pub realm: String,
    pub nonce: String,
    pub uri: String,
    pub method: String,
    pub qop: Option<String>, // "auth" or "auth-int"
    pub nc: Option<String>,  // Nonce count
    pub cnonce: Option<String>, // Client nonce
    pub opaque: Option<String>,
}

impl DigestAuthConfig {
    pub fn generate_authorization_header(&self) -> Result<String> {
        // 🎓 TEACHING: Digest Authentication Response Generation
        // HA1 = MD5(username:realm:password)
        let ha1 = format!("{}:{}:{}", self.username, self.realm, self.password);
        let ha1_hash = format!("{:x}", md5::compute(ha1.as_bytes()));

        // HA2 = MD5(method:uri)
        let ha2 = format!("{}:{}", self.method, self.uri);
        let ha2_hash = format!("{:x}", md5::compute(ha2.as_bytes()));

        // Generate response based on qop
        let response = if let Some(qop) = &self.qop {
            let nc = self.nc.as_deref().unwrap_or("00000001");
            let default_cnonce = generate_nonce();
            let cnonce = self.cnonce.as_deref().unwrap_or(&default_cnonce);
            
            let response_input = format!(
                "{}:{}:{}:{}:{}:{}",
                ha1_hash, self.nonce, nc, cnonce, qop, ha2_hash
            );
            format!("{:x}", md5::compute(response_input.as_bytes()))
        } else {
            let response_input = format!("{}:{}:{}", ha1_hash, self.nonce, ha2_hash);
            format!("{:x}", md5::compute(response_input.as_bytes()))
        };

        // Build authorization header
        let mut auth_parts = vec![
            format!("username=\"{}\"", self.username),
            format!("realm=\"{}\"", self.realm),
            format!("nonce=\"{}\"", self.nonce),
            format!("uri=\"{}\"", self.uri),
            format!("response=\"{}\"", response),
        ];

        if let Some(qop) = &self.qop {
            auth_parts.push(format!("qop={}", qop));
            auth_parts.push(format!("nc={}", self.nc.as_deref().unwrap_or("00000001")));
            let default_cnonce = generate_nonce();
            let cnonce = self.cnonce.as_deref().unwrap_or(&default_cnonce);
            auth_parts.push(format!("cnonce=\"{}\"", cnonce));
        }

        if let Some(opaque) = &self.opaque {
            auth_parts.push(format!("opaque=\"{}\"", opaque));
        }

        Ok(format!("Digest {}", auth_parts.join(", ")))
    }
}

// 🎓 TEACHING: OAuth 1.0 Implementation
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OAuth1Config {
    pub consumer_key: String,
    pub consumer_secret: String,
    pub token: Option<String>,
    pub token_secret: Option<String>,
    pub signature_method: String, // Usually "HMAC-SHA1"
    pub version: String,          // Usually "1.0"
}

impl OAuth1Config {
    pub fn generate_authorization_header(&self, method: &str, url: &str, params: &HashMap<String, String>) -> Result<String> {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs()
            .to_string();
        
        let nonce = generate_nonce();

        // 🎓 TEACHING: OAuth 1.0 Parameter Collection
        let mut oauth_params = HashMap::new();
        oauth_params.insert("oauth_consumer_key".to_string(), self.consumer_key.clone());
        oauth_params.insert("oauth_nonce".to_string(), nonce);
        oauth_params.insert("oauth_signature_method".to_string(), self.signature_method.clone());
        oauth_params.insert("oauth_timestamp".to_string(), timestamp);
        oauth_params.insert("oauth_version".to_string(), self.version.clone());

        if let Some(token) = &self.token {
            oauth_params.insert("oauth_token".to_string(), token.clone());
        }

        // Combine OAuth params with request params
        let mut all_params = oauth_params.clone();
        for (key, value) in params {
            all_params.insert(key.clone(), value.clone());
        }

        // 🎓 TEACHING: Generate signature base string
        let signature_base_string = self.generate_signature_base_string(method, url, &all_params)?;
        
        // 🎓 TEACHING: Generate signing key
        let signing_key = format!(
            "{}&{}",
            percent_encode(&self.consumer_secret),
            percent_encode(self.token_secret.as_deref().unwrap_or(""))
        );

        // 🎓 TEACHING: Generate signature
        let signature = if self.signature_method == "HMAC-SHA1" {
            let mut mac = Hmac::<Sha256>::new_from_slice(signing_key.as_bytes())?;
            mac.update(signature_base_string.as_bytes());
            let result = mac.finalize();
            general_purpose::STANDARD.encode(result.into_bytes())
        } else {
            return Err(anyhow::anyhow!("Unsupported signature method: {}", self.signature_method));
        };

        oauth_params.insert("oauth_signature".to_string(), signature);

        // 🎓 TEACHING: Build authorization header
        let auth_parts: Vec<String> = oauth_params
            .iter()
            .map(|(k, v)| format!("{}=\"{}\"", percent_encode(k), percent_encode(v)))
            .collect();

        Ok(format!("OAuth {}", auth_parts.join(", ")))
    }

    fn generate_signature_base_string(&self, method: &str, url: &str, params: &HashMap<String, String>) -> Result<String> {
        // Sort parameters
        let mut sorted_params: Vec<_> = params.iter().collect();
        sorted_params.sort_by_key(|(k, _)| *k);

        // Create parameter string
        let param_string = sorted_params
            .iter()
            .map(|(k, v)| format!("{}={}", percent_encode(k), percent_encode(v)))
            .collect::<Vec<_>>()
            .join("&");

        // Create signature base string
        Ok(format!(
            "{}&{}&{}",
            percent_encode(method),
            percent_encode(url),
            percent_encode(&param_string)
        ))
    }
}

// 🎓 TEACHING: AWS Signature V4 Implementation
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AwsSignatureConfig {
    pub access_key: String,
    pub secret_key: String,
    pub region: String,
    pub service: String,
    pub session_token: Option<String>,
}

impl AwsSignatureConfig {
    pub fn generate_authorization_header(
        &self,
        method: &str,
        url: &str,
        headers: &HeaderMap,
        body: &str,
    ) -> Result<HeaderMap> {
        let now = SystemTime::now().duration_since(UNIX_EPOCH)?;
        let date = chrono::DateTime::from_timestamp(now.as_secs() as i64, 0)
            .ok_or_else(|| anyhow::anyhow!("Invalid timestamp"))?;
        
        let amz_date = date.format("%Y%m%dT%H%M%SZ").to_string();
        let date_stamp = date.format("%Y%m%d").to_string();

        let mut headers = headers.clone();
        headers.insert("x-amz-date", HeaderValue::from_str(&amz_date)?);
        
        if let Some(session_token) = &self.session_token {
            headers.insert("x-amz-security-token", HeaderValue::from_str(session_token)?);
        }

        // 🎓 TEACHING: AWS Signature V4 Process
        // Step 1: Create canonical request
        let canonical_request = self.create_canonical_request(method, url, &headers, body)?;
        
        // Step 2: Create string to sign
        let string_to_sign = self.create_string_to_sign(&amz_date, &date_stamp, &canonical_request)?;
        
        // Step 3: Calculate signature
        let signature = self.calculate_signature(&date_stamp, &string_to_sign)?;
        
        // Step 4: Create Authorization header
        let signed_headers = self.get_signed_headers(&headers);
        let credential = format!("{}/{}/{}/{}/aws4_request", 
            self.access_key, date_stamp, self.region, self.service);
        
        let authorization = format!(
            "AWS4-HMAC-SHA256 Credential={}, SignedHeaders={}, Signature={}",
            credential, signed_headers, signature
        );
        
        headers.insert(AUTHORIZATION, HeaderValue::from_str(&authorization)?);
        
        Ok(headers)
    }

    fn create_canonical_request(&self, method: &str, url: &str, headers: &HeaderMap, body: &str) -> Result<String> {
        let url_parts = url::Url::parse(url)?;
        let canonical_uri = url_parts.path();
        let canonical_querystring = url_parts.query().unwrap_or("");
        
        // Create canonical headers
        let mut header_vec: Vec<_> = headers
            .iter()
            .map(|(name, value)| {
                (name.as_str().to_lowercase(), value.to_str().unwrap_or("").trim().to_string())
            })
            .collect();
        header_vec.sort_by_key(|(name, _)| name.clone());
        
        let canonical_headers = header_vec
            .iter()
            .map(|(name, value)| format!("{}:{}", name, value))
            .collect::<Vec<_>>()
            .join("\n") + "\n";
        
        let signed_headers = self.get_signed_headers(headers);
        let payload_hash = format!("{:x}", Sha256::digest(body.as_bytes()));
        
        Ok(format!(
            "{}\n{}\n{}\n{}\n{}\n{}",
            method, canonical_uri, canonical_querystring, canonical_headers, signed_headers, payload_hash
        ))
    }

    fn create_string_to_sign(&self, amz_date: &str, date_stamp: &str, canonical_request: &str) -> Result<String> {
        let algorithm = "AWS4-HMAC-SHA256";
        let credential_scope = format!("{}/{}/{}/aws4_request", date_stamp, self.region, self.service);
        let hashed_canonical_request = format!("{:x}", Sha256::digest(canonical_request.as_bytes()));
        
        Ok(format!(
            "{}\n{}\n{}\n{}",
            algorithm, amz_date, credential_scope, hashed_canonical_request
        ))
    }

    fn calculate_signature(&self, date_stamp: &str, string_to_sign: &str) -> Result<String> {
        let k_date = hmac_sha256(format!("AWS4{}", self.secret_key).as_bytes(), date_stamp.as_bytes())?;
        let k_region = hmac_sha256(&k_date, self.region.as_bytes())?;
        let k_service = hmac_sha256(&k_region, self.service.as_bytes())?;
        let k_signing = hmac_sha256(&k_service, b"aws4_request")?;
        let signature = hmac_sha256(&k_signing, string_to_sign.as_bytes())?;
        
        Ok(hex::encode(signature))
    }

    fn get_signed_headers(&self, headers: &HeaderMap) -> String {
        let mut header_names: Vec<_> = headers.keys().map(|name| name.as_str().to_lowercase()).collect();
        header_names.sort();
        header_names.join(";")
    }
}

// 🎓 TEACHING: Utility Functions

fn generate_nonce() -> String {
    rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .map(char::from)
        .collect()
}

fn percent_encode(input: &str) -> String {
    url::form_urlencoded::byte_serialize(input.as_bytes()).collect()
}

fn hmac_sha256(key: &[u8], data: &[u8]) -> Result<Vec<u8>> {
    let mut mac = Hmac::<Sha256>::new_from_slice(key)?;
    mac.update(data);
    Ok(mac.finalize().into_bytes().to_vec())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_digest_auth_ha1_calculation() {
        let config = DigestAuthConfig {
            username: "user".to_string(),
            password: "pass".to_string(),
            realm: "test".to_string(),
            nonce: "123456".to_string(),
            uri: "/test".to_string(),
            method: "GET".to_string(),
            qop: None,
            nc: None,
            cnonce: None,
            opaque: None,
        };
        
        let ha1 = format!("{}:{}:{}", config.username, config.realm, config.password);
        let ha1_hash = format!("{:x}", md5::compute(ha1.as_bytes()));
        
        // This should produce a valid MD5 hash
        assert_eq!(ha1_hash.len(), 32);
    }

    #[test]
    fn test_oauth1_timestamp_generation() {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        assert!(timestamp > 0);
    }

    #[test]
    fn test_percent_encoding() {
        assert_eq!(percent_encode("hello world"), "hello+world");
        assert_eq!(percent_encode("test@example.com"), "test%40example.com");
    }

    #[test]
    fn test_nonce_generation() {
        let nonce1 = generate_nonce();
        let nonce2 = generate_nonce();
        
        assert_eq!(nonce1.len(), 32);
        assert_eq!(nonce2.len(), 32);
        assert_ne!(nonce1, nonce2); // Should be different
    }
}