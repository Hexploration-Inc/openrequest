use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

// Import our database module
mod database;
mod importer_exporter;
mod oauth; // Phase 2: OAuth 2.0 support
mod auth;  // Phase 2: Advanced authentication
use database::Database;

// 🎓 TEACHING: This is our application state
// The Mutex ensures thread safety (only one thread can access it at a time)
type DatabaseState = Mutex<Option<Database>>;

#[derive(Debug, Serialize, Deserialize)]
struct ApiRequest {
    method: String,
    url: String,
    params: HashMap<String, String>,
    headers: HashMap<String, String>,
    body: Option<String>,
    auth_type: Option<String>,
    auth_data: Option<String>,
    // Phase 2: Cache options
    use_cache: Option<bool>,
    cache_duration: Option<u64>, // Cache duration in seconds
}

#[derive(Debug, Serialize, Deserialize)]
struct ApiResponse {
    status: u16,
    headers: HashMap<String, String>,
    body: String,
    // Phase 2: Cache metadata
    from_cache: Option<bool>,
    cache_time: Option<String>,
}

#[tauri::command]
async fn send_api_request(
    request: ApiRequest,
    db_state: State<'_, DatabaseState>,
) -> Result<ApiResponse, String> {
    // 🎓 TEACHING: Now we support variable interpolation in requests
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    // Interpolate variables in the URL
    let interpolated_url = db.interpolate_string(&request.url).await.map_err(|e| e.to_string())?;

    // 🎓 TEACHING: Check cache first if caching is enabled
    let use_cache = request.use_cache.unwrap_or(false);
    if use_cache {
        let headers_json = serde_json::to_string(&request.headers).map_err(|e| e.to_string())?;
        let body_content = request.body.as_deref().unwrap_or("");
        
        if let Ok(Some(cached)) = db.get_cached_response(
            &request.method,
            &interpolated_url,
            &headers_json,
            body_content,
        ).await {
            let cached_headers: HashMap<String, String> = 
                serde_json::from_str(&cached.response_headers).map_err(|e| e.to_string())?;
            
            return Ok(ApiResponse {
                status: cached.response_status,
                headers: cached_headers,
                body: cached.response_body,
                from_cache: Some(true),
                cache_time: Some(cached.cache_time.to_rfc3339()),
            });
        }
    }

    let client = reqwest::Client::new();

    let method = match request.method.to_uppercase().as_str() {
        "GET" => reqwest::Method::GET,
        "POST" => reqwest::Method::POST,
        "PUT" => reqwest::Method::PUT,
        "DELETE" => reqwest::Method::DELETE,
        "PATCH" => reqwest::Method::PATCH,
        "HEAD" => reqwest::Method::HEAD,
        "OPTIONS" => reqwest::Method::OPTIONS,
        _ => return Err("Unsupported HTTP method".to_string()),
    };

    let mut req_builder = client.request(method, &interpolated_url).query(&request.params);

    // 🎓 TEACHING: Interpolate variables in headers
    for (key, value) in &request.headers {
        let interpolated_value = db.interpolate_string(value).await.map_err(|e| e.to_string())?;
        req_builder = req_builder.header(key, &interpolated_value);
    }

    if let Some(auth_type) = request.auth_type {
        match auth_type.as_str() {
            "basic" => {
                if let Some(auth_data) = request.auth_data {
                    // 🎓 TEACHING: For Basic Auth, we expect a JSON string with "username" and "password" fields.
                    // We need to parse this JSON and then apply the basic authentication to the request.
                    let auth: HashMap<String, String> =
                        serde_json::from_str(&auth_data).map_err(|e| e.to_string())?;
                    let username = auth
                        .get("username")
                        .ok_or("Username not found in auth_data")?;
                    let password = auth
                        .get("password")
                        .ok_or("Password not found in auth_data")?;
                    req_builder = req_builder.basic_auth(username, Some(password));
                }
            }
            "bearer" => {
                if let Some(auth_data) = request.auth_data {
                    // 🎓 TEACHING: For Bearer Auth, we expect the token to be in the "token" field of the JSON string.
                    let auth: HashMap<String, String> =
                        serde_json::from_str(&auth_data).map_err(|e| e.to_string())?;
                    let token = auth.get("token").ok_or("Token not found in auth_data")?;
                    req_builder = req_builder.bearer_auth(token);
                }
            }
            "api-key" => {
                if let Some(auth_data) = request.auth_data {
                    // 🎓 TEACHING: For API Key Auth, we expect "key", "value", and "in" fields.
                    // The "in" field can be either "header" or "query".
                    let auth: HashMap<String, String> =
                        serde_json::from_str(&auth_data).map_err(|e| e.to_string())?;
                    let key = auth.get("key").ok_or("Key not found in auth_data")?;
                    let value = auth.get("value").ok_or("Value not found in auth_data")?;
                    let in_ = auth.get("in").ok_or("In not found in auth_data")?;

                    if in_ == "header" {
                        req_builder = req_builder.header(key, value);
                    } else if in_ == "query" {
                        req_builder = req_builder.query(&[(key, value)]);
                    }
                }
            }
            "oauth2" => {
                // 🎓 TEACHING: OAuth 2.0 Bearer Token Authentication
                // We expect the auth_data to contain an access_token field
                if let Some(auth_data) = request.auth_data {
                    let auth: HashMap<String, String> =
                        serde_json::from_str(&auth_data).map_err(|e| e.to_string())?;
                    let access_token = auth.get("access_token").ok_or("Access token not found in auth_data")?;
                    req_builder = req_builder.bearer_auth(access_token);
                }
            }
            "digest" => {
                // 🎓 TEACHING: Digest Authentication
                if let Some(auth_data) = request.auth_data {
                    let digest_config: auth::DigestAuthConfig =
                        serde_json::from_str(&auth_data).map_err(|e| e.to_string())?;
                    let auth_header = digest_config.generate_authorization_header()
                        .map_err(|e| e.to_string())?;
                    req_builder = req_builder.header("Authorization", auth_header);
                }
            }
            "oauth1" => {
                // 🎓 TEACHING: OAuth 1.0 Authentication
                if let Some(auth_data) = request.auth_data {
                    let oauth1_config: auth::OAuth1Config =
                        serde_json::from_str(&auth_data).map_err(|e| e.to_string())?;
                    let auth_header = oauth1_config.generate_authorization_header(
                        &request.method,
                        &interpolated_url,
                        &request.params
                    ).map_err(|e| e.to_string())?;
                    req_builder = req_builder.header("Authorization", auth_header);
                }
            }
            "aws-signature" => {
                // 🎓 TEACHING: AWS Signature V4 Authentication
                if let Some(auth_data) = request.auth_data {
                    let aws_config: auth::AwsSignatureConfig =
                        serde_json::from_str(&auth_data).map_err(|e| e.to_string())?;
                    
                    // Get current headers from the request builder
                    let mut headers = reqwest::header::HeaderMap::new();
                    for (key, value) in &request.headers {
                        let interpolated_value = db.interpolate_string(value).await.map_err(|e| e.to_string())?;
                        headers.insert(
                            reqwest::header::HeaderName::from_bytes(key.as_bytes()).map_err(|e| e.to_string())?,
                            reqwest::header::HeaderValue::from_str(&interpolated_value).map_err(|e| e.to_string())?
                        );
                    }
                    
                    let body_content = request.body.as_deref().unwrap_or("");
                    let interpolated_body = db.interpolate_string(body_content).await.map_err(|e| e.to_string())?;
                    
                    let signed_headers = aws_config.generate_authorization_header(
                        &request.method,
                        &interpolated_url,
                        &headers,
                        &interpolated_body
                    ).map_err(|e| e.to_string())?;
                    
                    // Apply the signed headers to the request
                    for (name, value) in signed_headers.iter() {
                        req_builder = req_builder.header(name, value);
                    }
                }
            }
            _ => {} // No other auth types are supported yet
        }
    }

    // 🎓 TEACHING: Interpolate variables in request body
    if let Some(ref body) = request.body {
        let interpolated_body = db.interpolate_string(body).await.map_err(|e| e.to_string())?;
        req_builder = req_builder.body(interpolated_body);
    }

    let res = req_builder.send().await.map_err(|e| e.to_string())?;

    let status = res.status().as_u16();
    let mut headers = HashMap::new();
    for (key, value) in res.headers().iter() {
        headers.insert(key.to_string(), value.to_str().unwrap_or("").to_string());
    }

    let body = res.text().await.map_err(|e| e.to_string())?;

    // 🎓 TEACHING: Store response in cache if caching is enabled
    if use_cache && request.cache_duration.is_some() {
        let headers_json = serde_json::to_string(&request.headers).map_err(|e| e.to_string())?;
        let response_headers_json = serde_json::to_string(&headers).map_err(|e| e.to_string())?;
        let body_content = request.body.as_deref().unwrap_or("");
        
        // Attempt to cache the response, but don't fail if caching fails
        let _ = db.cache_response(
            request.method,
            interpolated_url,
            headers_json,
            body_content.to_string(),
            status,
            response_headers_json,
            body.clone(),
            request.cache_duration,
        ).await;
    }

    Ok(ApiResponse {
        status,
        headers,
        body,
        from_cache: Some(false),
        cache_time: None,
    })
}

// #[tauri::command]
// fn greet(name: &str) -> String {
//     format!("Hello, {}! You've been greeted from Rust!", name);
// }

// 🎓 TEACHING: This command initializes our database
#[tauri::command]
async fn init_database(db_state: State<'_, DatabaseState>) -> Result<String, String> {
    println!("🚀 Starting database initialization...");

    // 🎓 TEACHING: Use a more explicit database path
    // This creates the database file in the current directory
    let database_url = "sqlite:./openrequest.db?mode=rwc";

    let database = Database::new(database_url).await.map_err(|e| {
        let error_msg = format!("Database initialization failed: {}", e);
        println!("❌ {}", error_msg);
        error_msg
    })?;

    // Store the database in our application state
    *db_state.lock().unwrap() = Some(database);

    let success_msg = "✅ Database initialized successfully".to_string();
    println!("{}", success_msg);
    Ok(success_msg)
}

// 🎓 TEACHING: Fixed version - extract database before await
#[tauri::command]
async fn create_collection(
    name: String,
    description: Option<String>,
    parent_id: Option<String>,
    db_state: State<'_, DatabaseState>,
) -> Result<database::Collection, String> {
    // 🎯 KEY FIX: Extract database from the guard immediately
    let db = {
        let db_guard = db_state.lock().unwrap();
        // Clone the database (it's cheap - just a connection pool)
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    }; // Lock is released here!

    // Now we can safely await without holding the lock
    db.create_collection(name, description, parent_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_collections(
    db_state: State<'_, DatabaseState>,
) -> Result<Vec<database::Collection>, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.get_collections().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_collection(
    collection: database::Collection,
    db_state: State<'_, DatabaseState>,
) -> Result<database::Collection, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.update_collection(collection)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_collection(id: String, db_state: State<'_, DatabaseState>) -> Result<(), String> {
    println!("🗑️ Rust: delete_collection called with id: {}", id);
    
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    println!("🔄 Rust: Calling database delete_collection...");
    let result = db.delete_collection(&id).await.map_err(|e| {
        println!("❌ Rust: Database delete_collection failed: {}", e);
        e.to_string()
    });
    
    if result.is_ok() {
        println!("✅ Rust: delete_collection completed successfully");
    }
    
    result
}

#[tauri::command]
async fn get_collection_by_id(
    id: String,
    db_state: State<'_, DatabaseState>,
) -> Result<Option<database::Collection>, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.get_collection_by_id(&id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_request(
    collection_id: String,
    name: String,
    method: String,
    url: String,
    db_state: State<'_, DatabaseState>,
) -> Result<database::Request, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.create_request(collection_id, name, method, url)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_requests_by_collection(
    collection_id: String,
    db_state: State<'_, DatabaseState>,
) -> Result<Vec<database::Request>, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.get_requests_by_collection(&collection_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_request(
    request: database::Request,
    db_state: State<'_, DatabaseState>,
) -> Result<database::Request, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.update_request(request).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_request(id: String, db_state: State<'_, DatabaseState>) -> Result<(), String> {
    println!("🗑️ Rust: delete_request called with id: {}", id);
    
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    println!("🔄 Rust: Calling database delete_request...");
    let result = db.delete_request(&id).await.map_err(|e| {
        println!("❌ Rust: Database delete_request failed: {}", e);
        e.to_string()
    });
    
    if result.is_ok() {
        println!("✅ Rust: delete_request completed successfully");
    }
    
    result
}

#[tauri::command]
async fn get_request_by_id(
    id: String,
    db_state: State<'_, DatabaseState>,
) -> Result<Option<database::Request>, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.get_request_by_id(&id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn export_collection_to_json(
    collection_id: String,
    db_state: State<'_, DatabaseState>,
) -> Result<String, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    // 1. Fetch the collection from the database
    let collection = db
        .get_collection_by_id(&collection_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Collection not found".to_string())?;

    // 2. Fetch all requests for that collection
    let requests = db
        .get_requests_by_collection(&collection_id)
        .await
        .map_err(|e| e.to_string())?;

    // 3. Convert database requests to JSON requests
    let json_requests = requests
        .into_iter()
        .map(|req| importer_exporter::JsonRequest {
            name: req.name,
            method: req.method,
            url: req.url,
            params: req.params,
            headers: req.headers,
            body_type: req.body_type,
            body_str: req.body_str,
            auth_type: req.auth_type,
            auth_data: req.auth_data,
        })
        .collect();

    // 4. Create the final JSON collection structure
    let json_collection = importer_exporter::JsonCollection {
        name: collection.name,
        description: collection.description,
        requests: json_requests,
    };

    // 5. Serialize the structure to a JSON string
    serde_json::to_string_pretty(&json_collection).map_err(|e| e.to_string())
}

#[tauri::command]
async fn import_collection_from_json(
    json_str: String,
    db_state: State<'_, DatabaseState>,
) -> Result<database::Collection, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    // 1. Deserialize the JSON string into our import structure
    let json_collection: importer_exporter::JsonCollection =
        serde_json::from_str(&json_str).map_err(|e| e.to_string())?;

    // 2. Create the new collection in the database
    let new_collection = db
        .create_collection(json_collection.name, json_collection.description, None)
        .await
        .map_err(|e| e.to_string())?;

    // 3. Iterate over the requests from the JSON and create them
    for json_req in json_collection.requests {
        let mut new_req = db
            .create_request(
                new_collection.id.clone(),
                json_req.name,
                json_req.method,
                json_req.url,
            )
            .await
            .map_err(|e| e.to_string())?;

        // 4. Update the request with the additional details from the JSON
        new_req.params = json_req.params;
        new_req.headers = json_req.headers;
        new_req.body_type = json_req.body_type;
        new_req.body_str = json_req.body_str;
        new_req.auth_type = json_req.auth_type;
        new_req.auth_data = json_req.auth_data;

        db.update_request(new_req)
            .await
            .map_err(|e| e.to_string())?;
    }

    Ok(new_collection)
}

// ============ PHASE 2: ENVIRONMENT MANAGEMENT COMMANDS ============

#[tauri::command]
async fn create_environment(
    name: String,
    db_state: State<'_, DatabaseState>,
) -> Result<database::Environment, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.create_environment(name).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_environments(
    db_state: State<'_, DatabaseState>,
) -> Result<Vec<database::Environment>, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.get_environments().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn set_active_environment(
    id: String,
    db_state: State<'_, DatabaseState>,
) -> Result<database::Environment, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.set_active_environment(&id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_active_environment(
    db_state: State<'_, DatabaseState>,
) -> Result<Option<database::Environment>, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.get_active_environment().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_environment(
    environment: database::Environment,
    db_state: State<'_, DatabaseState>,
) -> Result<database::Environment, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.update_environment(environment).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_environment(
    id: String,
    db_state: State<'_, DatabaseState>,
) -> Result<(), String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.delete_environment(&id).await.map_err(|e| e.to_string())
}

// ============ PHASE 2: VARIABLE MANAGEMENT COMMANDS ============

#[tauri::command]
async fn create_variable(
    environment_id: Option<String>,
    key: String,
    value: String,
    is_secret: bool,
    db_state: State<'_, DatabaseState>,
) -> Result<database::Variable, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.create_variable(environment_id, key, value, is_secret)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_variables(
    environment_id: Option<String>,
    db_state: State<'_, DatabaseState>,
) -> Result<Vec<database::Variable>, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    let env_id_ref = environment_id.as_deref();
    db.get_variables(env_id_ref).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_active_variables(
    db_state: State<'_, DatabaseState>,
) -> Result<Vec<database::Variable>, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.get_active_variables().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_variable(
    variable: database::Variable,
    db_state: State<'_, DatabaseState>,
) -> Result<database::Variable, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.update_variable(variable).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_variable(
    id: String,
    db_state: State<'_, DatabaseState>,
) -> Result<(), String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.delete_variable(&id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn interpolate_string(
    input: String,
    db_state: State<'_, DatabaseState>,
) -> Result<String, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.interpolate_string(&input).await.map_err(|e| e.to_string())
}

// ============ PHASE 2: OAUTH 2.0 COMMANDS ============

#[tauri::command]
async fn oauth_get_authorization_url(config: oauth::OAuthConfig) -> Result<String, String> {
    let mut oauth_manager = oauth::OAuthManager::new(config);
    oauth_manager.get_authorization_url().map_err(|e| e.to_string())
}

#[tauri::command]
async fn oauth_exchange_code_for_token(
    config: oauth::OAuthConfig,
    authorization_code: String,
    csrf_token: String,
) -> Result<oauth::OAuthToken, String> {
    let mut oauth_manager = oauth::OAuthManager::new(config);
    // Generate the authorization URL first to set up PKCE and CSRF
    oauth_manager.get_authorization_url().map_err(|e| e.to_string())?;
    
    oauth_manager
        .exchange_code_for_token(&authorization_code, &csrf_token)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn oauth_client_credentials_flow(
    config: oauth::OAuthConfig,
) -> Result<oauth::OAuthToken, String> {
    let oauth_manager = oauth::OAuthManager::new(config);
    oauth_manager
        .client_credentials_flow()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn oauth_refresh_token(
    config: oauth::OAuthConfig,
    refresh_token: String,
) -> Result<oauth::OAuthToken, String> {
    let oauth_manager = oauth::OAuthManager::new(config);
    oauth_manager
        .refresh_token(&refresh_token)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn oauth_parse_callback_url(callback_url: String) -> Result<(String, String), String> {
    oauth::parse_callback_url(&callback_url).map_err(|e| e.to_string())
}

// ============ PHASE 2: RESPONSE CACHING COMMANDS ============

#[tauri::command]
async fn get_cache_stats(db_state: State<'_, DatabaseState>) -> Result<(u64, u64), String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.get_cache_stats().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn clear_expired_cache(db_state: State<'_, DatabaseState>) -> Result<u64, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.clear_expired_cache().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn clear_all_cache(db_state: State<'_, DatabaseState>) -> Result<u64, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.clear_all_cache().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_cached_response_by_hash(
    request_hash: String,
    db_state: State<'_, DatabaseState>,
) -> Result<Option<database::ResponseCache>, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.get_cached_response_by_hash(&request_hash).await.map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(DatabaseState::default())
        .invoke_handler(tauri::generate_handler![
            init_database,
            create_collection,
            get_collections,
            update_collection,
            delete_collection,
            get_collection_by_id,
            create_request,
            get_requests_by_collection,
            update_request,
            delete_request,
            get_request_by_id,
            send_api_request,
            export_collection_to_json,
            import_collection_from_json,
            // Phase 2: Environment Management
            create_environment,
            get_environments,
            set_active_environment,
            get_active_environment,
            update_environment,
            delete_environment,
            // Phase 2: Variable Management
            create_variable,
            get_variables,
            get_active_variables,
            update_variable,
            delete_variable,
            interpolate_string,
            // Phase 2: OAuth 2.0
            oauth_get_authorization_url,
            oauth_exchange_code_for_token,
            oauth_client_credentials_flow,
            oauth_refresh_token,
            oauth_parse_callback_url,
            // Phase 2: Response Caching
            get_cache_stats,
            clear_expired_cache,
            clear_all_cache,
            get_cached_response_by_hash
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// 🎓 TEACHING: Test-only version of send_api_request without database dependency
#[cfg(test)]
async fn send_api_request_test_only(request: ApiRequest) -> Result<ApiResponse, String> {
    // For tests, we'll skip the database/caching functionality
    // and only test the HTTP request parts
    
    let client = reqwest::Client::new();

    let method = match request.method.to_uppercase().as_str() {
        "GET" => reqwest::Method::GET,
        "POST" => reqwest::Method::POST,
        "PUT" => reqwest::Method::PUT,
        "DELETE" => reqwest::Method::DELETE,
        "PATCH" => reqwest::Method::PATCH,
        "HEAD" => reqwest::Method::HEAD,
        "OPTIONS" => reqwest::Method::OPTIONS,
        _ => return Err("Unsupported HTTP method".to_string()),
    };

    let mut req_builder = client.request(method, &request.url).query(&request.params);

    // Add headers (no interpolation in tests)
    for (key, value) in &request.headers {
        req_builder = req_builder.header(key, value);
    }

    // Handle authentication (simplified for tests)
    if let Some(auth_type) = request.auth_type {
        match auth_type.as_str() {
            "basic" => {
                if let Some(auth_data) = request.auth_data {
                    let auth: HashMap<String, String> =
                        serde_json::from_str(&auth_data).map_err(|e| e.to_string())?;
                    let username = auth
                        .get("username")
                        .ok_or("Username not found in auth_data")?;
                    let password = auth
                        .get("password")
                        .ok_or("Password not found in auth_data")?;
                    req_builder = req_builder.basic_auth(username, Some(password));
                }
            }
            "bearer" => {
                if let Some(auth_data) = request.auth_data {
                    let auth: HashMap<String, String> =
                        serde_json::from_str(&auth_data).map_err(|e| e.to_string())?;
                    let token = auth.get("token").ok_or("Token not found in auth_data")?;
                    req_builder = req_builder.bearer_auth(token);
                }
            }
            "api-key" => {
                if let Some(auth_data) = request.auth_data {
                    let auth: HashMap<String, String> =
                        serde_json::from_str(&auth_data).map_err(|e| e.to_string())?;
                    let key = auth.get("key").ok_or("Key not found in auth_data")?;
                    let value = auth.get("value").ok_or("Value not found in auth_data")?;
                    let in_ = auth.get("in").ok_or("In not found in auth_data")?;

                    if in_ == "header" {
                        req_builder = req_builder.header(key, value);
                    } else if in_ == "query" {
                        req_builder = req_builder.query(&[(key, value)]);
                    }
                }
            }
            _ => {} // Skip other auth types in tests
        }
    }

    // Add body if present (no interpolation in tests)
    if let Some(ref body) = request.body {
        req_builder = req_builder.body(body.clone());
    }

    let res = req_builder.send().await.map_err(|e| e.to_string())?;

    let status = res.status().as_u16();
    let mut headers = HashMap::new();
    for (key, value) in res.headers().iter() {
        headers.insert(key.to_string(), value.to_str().unwrap_or("").to_string());
    }

    let body = res.text().await.map_err(|e| e.to_string())?;

    Ok(ApiResponse {
        status,
        headers,
        body,
        from_cache: Some(false),
        cache_time: None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ApiRequest;
    use std::collections::HashMap;

    // 🎓 TEACHING: This is an async integration test for our API command
    #[tokio::test]
    async fn test_send_api_request_get() {
        // 1. Setup: Create a mock request, just like the frontend would
        let mut headers = HashMap::new();
        headers.insert("X-Test-Header".to_string(), "gemini-test".to_string());

        let mut params = HashMap::new();
        params.insert("param1".to_string(), "value1".to_string());
        params.insert("param2".to_string(), "value with spaces".to_string());

        let api_request = ApiRequest {
            method: "GET".to_string(),
            url: "https://httpbin.org/get".to_string(),
            params,
            headers,
            body: None,
            auth_type: None,
            auth_data: None,
            use_cache: Some(false),
            cache_duration: None,
        };

        // 2. Execute: Call our test-only function
        let result = send_api_request_test_only(api_request).await;

        // 3. Assert & Verify: Check if the call was successful and print the output
        assert!(result.is_ok(), "The API request failed: {:?}", result.err());

        if let Ok(response) = result {
            println!("✅ API Request Successful!");
            println!("   Status: {}", response.status);
            println!("   Headers: {:#?}", response.headers);
            println!("   Body: {}", response.body);

            // You can also add specific assertions here, for example:
            assert_eq!(response.status, 200);
            assert!(response.body.contains("gemini-test"));
            assert!(response.body.contains("param1"));
            assert!(response.body.contains("value with spaces"));
        }
    }

    #[tokio::test]
    async fn test_send_api_request_bearer_auth() {
        // 1. Setup: Create a mock request with Bearer Token authentication
        let mut headers = HashMap::new();
        headers.insert("Content-Type".to_string(), "application/json".to_string());

        let mut auth_data = HashMap::new();
        auth_data.insert("token".to_string(), "my-secret-token".to_string());

        let api_request = ApiRequest {
            method: "GET".to_string(),
            url: "https://httpbin.org/bearer".to_string(),
            params: HashMap::new(),
            headers,
            body: None,
            auth_type: Some("bearer".to_string()),
            auth_data: Some(serde_json::to_string(&auth_data).unwrap()),
            use_cache: Some(false),
            cache_duration: None,
        };

        // 2. Execute: Call our test-only function
        let result = send_api_request_test_only(api_request).await;

        // 3. Assert & Verify: Check if the call was successful and print the output
        assert!(result.is_ok(), "The API request failed: {:?}", result.err());

        if let Ok(response) = result {
            println!("✅ API Request Successful!");
            println!("   Status: {}", response.status);
            println!("   Headers: {:#?}", response.headers);
            println!("   Body: {}", response.body);

            // You can also add specific assertions here, for example:
            assert_eq!(response.status, 200);
            assert!(response.body.contains("my-secret-token"));
        }
    }

    #[tokio::test]
    async fn test_send_api_request_basic_auth() {
        // 1. Setup: Create a mock request with Basic authentication
        let mut auth_data = HashMap::new();
        auth_data.insert("username".to_string(), "testuser".to_string());
        auth_data.insert("password".to_string(), "testpass".to_string());

        let api_request = ApiRequest {
            method: "GET".to_string(),
            // This httpbin endpoint validates the user/pass in the URL
            url: "https://httpbin.org/basic-auth/testuser/testpass".to_string(),
            params: HashMap::new(),
            headers: HashMap::new(),
            body: None,
            auth_type: Some("basic".to_string()),
            auth_data: Some(serde_json::to_string(&auth_data).unwrap()),
            use_cache: Some(false),
            cache_duration: None,
        };

        // 2. Execute
        let result = send_api_request_test_only(api_request).await;

        // 3. Assert & Verify
        assert!(result.is_ok(), "The API request failed: {:?}", result.err());

        if let Ok(response) = result {
            println!("✅ Basic Auth Request Successful!");
            println!("   Status: {}", response.status);
            println!("   Body: {}", response.body);

            // httpbin returns 200 OK for successful basic auth
            assert_eq!(response.status, 200);
            // The response body confirms authentication
            assert!(response.body.contains("\"authenticated\": true"));
            assert!(response.body.contains("\"user\": \"testuser\""));
        }
    }

    #[tokio::test]
    async fn test_send_api_request_api_key_header() {
        // 1. Setup: API Key in Header
        let mut auth_data = HashMap::new();
        auth_data.insert("key".to_string(), "X-Api-Key".to_string());
        auth_data.insert("value".to_string(), "my-secret-api-key".to_string());
        auth_data.insert("in".to_string(), "header".to_string());

        let api_request = ApiRequest {
            method: "GET".to_string(),
            url: "https://httpbin.org/headers".to_string(),
            params: HashMap::new(),
            headers: HashMap::new(),
            body: None,
            auth_type: Some("api-key".to_string()),
            auth_data: Some(serde_json::to_string(&auth_data).unwrap()),
            use_cache: Some(false),
            cache_duration: None,
        };

        // 2. Execute
        let result = send_api_request_test_only(api_request).await;

        // 3. Assert & Verify
        assert!(result.is_ok(), "The API request failed: {:?}", result.err());

        if let Ok(response) = result {
            println!("✅ API Key (Header) Request Successful!");
            println!("   Status: {}", response.status);
            println!("   Body: {}", response.body);

            assert_eq!(response.status, 200);
            // httpbin.org/headers echoes the request headers back.
            // We check if our API key is in the response body.
            assert!(response
                .body
                .contains("\"X-Api-Key\": \"my-secret-api-key\""));
        }
    }

    #[tokio::test]
    async fn test_send_api_request_api_key_query() {
        // 1. Setup: API Key in Query Params
        let mut auth_data = HashMap::new();
        auth_data.insert("key".to_string(), "api_key".to_string());
        auth_data.insert("value".to_string(), "my-secret-api-key".to_string());
        auth_data.insert("in".to_string(), "query".to_string());

        let api_request = ApiRequest {
            method: "GET".to_string(),
            url: "https://httpbin.org/get".to_string(),
            params: HashMap::new(),
            headers: HashMap::new(),
            body: None,
            auth_type: Some("api-key".to_string()),
            auth_data: Some(serde_json::to_string(&auth_data).unwrap()),
            use_cache: Some(false),
            cache_duration: None,
        };

        // 2. Execute
        let result = send_api_request_test_only(api_request).await;

        // 3. Assert & Verify
        assert!(result.is_ok(), "The API request failed: {:?}", result.err());

        if let Ok(response) = result {
            println!("✅ API Key (Query) Request Successful!");
            println!("   Status: {}", response.status);
            println!("   Body: {}", response.body);

            assert_eq!(response.status, 200);
            // httpbin.org/get echoes the request args back.
            // We check if our API key is in the response body's "args".
            assert!(response.body.contains("\"api_key\": \"my-secret-api-key\""));
        }
    }
}
