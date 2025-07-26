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
    headers: HashMap<String, String>,
    body: Option<String>,
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

    let mut req_builder = client.request(method, &request.url);

    for (key, value) in request.headers {
        req_builder = req_builder.header(&key, &value);
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(DatabaseState::default())
        .invoke_handler(tauri::generate_handler![
            init_database,
            create_collection,
            get_collections,
            create_request,
            get_requests_by_collection,
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

        let api_request = ApiRequest {
            method: "GET".to_string(),
            url: "https://httpbin.org/get".to_string(),
            headers,
            body: None,
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
        }
    }
}
