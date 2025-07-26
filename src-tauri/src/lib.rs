// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::State;
use std::sync::Mutex;

// Import our database module
mod database;
use database::Database;

// 🎓 TEACHING: This is our application state
// The Mutex ensures thread safety (only one thread can access it at a time)
type DatabaseState = Mutex<Option<Database>>;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// 🎓 TEACHING: This command initializes our database
#[tauri::command]
async fn init_database(db_state: State<'_, DatabaseState>) -> Result<String, String> {
    println!("🚀 Starting database initialization...");
    
    // 🎓 TEACHING: Use a more explicit database path
    // This creates the database file in the current directory
    let database_url = "sqlite:./openrequest.db?mode=rwc";
    
    let database = Database::new(database_url)
        .await
        .map_err(|e| {
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
async fn get_collections(db_state: State<'_, DatabaseState>) -> Result<Vec<database::Collection>, String> {
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };
    
    db.get_collections()
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(DatabaseState::default())
        .invoke_handler(tauri::generate_handler![
            greet,
            init_database,
            create_collection,
            get_collections,
            create_request,
            get_requests_by_collection
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
