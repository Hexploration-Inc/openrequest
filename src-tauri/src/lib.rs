use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

// Import our database module
mod database;
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
}

#[derive(Debug, Serialize, Deserialize)]
struct ApiResponse {
    status: u16,
    headers: HashMap<String, String>,
    body: String,
}

#[tauri::command]
async fn send_api_request(request: ApiRequest) -> Result<ApiResponse, String> {
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

    for (key, value) in request.headers {
        req_builder = req_builder.header(&key, &value);
    }

    if let Some(auth_type) = request.auth_type {
        match auth_type.as_str() {
            "basic" => {
                if let Some(auth_data) = request.auth_data {
                    // 🎓 TEACHING: For Basic Auth, we expect a JSON string with "username" and "password" fields.
                    // We need to parse this JSON and then apply the basic authentication to the request.
                    let auth: HashMap<String, String> = serde_json::from_str(&auth_data).map_err(|e| e.to_string())?;
                    let username = auth.get("username").ok_or("Username not found in auth_data")?;
                    let password = auth.get("password").ok_or("Password not found in auth_data")?;
                    req_builder = req_builder.basic_auth(username, Some(password));
                }
            }
            "bearer" => {
                if let Some(auth_data) = request.auth_data {
                    // 🎓 TEACHING: For Bearer Auth, we expect the token to be in the "token" field of the JSON string.
                    let auth: HashMap<String, String> = serde_json::from_str(&auth_data).map_err(|e| e.to_string())?;
                    let token = auth.get("token").ok_or("Token not found in auth_data")?;
                    req_builder = req_builder.bearer_auth(token);
                }
            }
            "api-key" => {
                if let Some(auth_data) = request.auth_data {
                    // 🎓 TEACHING: For API Key Auth, we expect "key", "value", and "in" fields.
                    // The "in" field can be either "header" or "query".
                    let auth: HashMap<String, String> = serde_json::from_str(&auth_data).map_err(|e| e.to_string())?;
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
            _ => {} // No other auth types are supported yet
        }
    }

    if let Some(body) = request.body {
        req_builder = req_builder.body(body);
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

    db.update_collection(collection).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_collection(
    id: String,
    db_state: State<'_, DatabaseState>,
) -> Result<(), String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.delete_collection(&id).await.map_err(|e| e.to_string())
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

    db.get_collection_by_id(&id).await.map_err(|e| e.to_string())
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
async fn delete_request(
    id: String,
    db_state: State<'_, DatabaseState>,
) -> Result<(), String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };

    db.delete_request(&id).await.map_err(|e| e.to_string())
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
            send_api_request
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
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
        };

        // 2. Execute: Call our command function directly
        let result = send_api_request(api_request).await;

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
        };

        // 2. Execute: Call our command function directly
        let result = send_api_request(api_request).await;

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
        };

        // 2. Execute
        let result = send_api_request(api_request).await;

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
        };

        // 2. Execute
        let result = send_api_request(api_request).await;

        // 3. Assert & Verify
        assert!(result.is_ok(), "The API request failed: {:?}", result.err());

        if let Ok(response) = result {
            println!("✅ API Key (Header) Request Successful!");
            println!("   Status: {}", response.status);
            println!("   Body: {}", response.body);

            assert_eq!(response.status, 200);
            // httpbin.org/headers echoes the request headers back.
            // We check if our API key is in the response body.
            assert!(response.body.contains("\"X-Api-Key\": \"my-secret-api-key\""));
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
        };

        // 2. Execute
        let result = send_api_request(api_request).await;

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
