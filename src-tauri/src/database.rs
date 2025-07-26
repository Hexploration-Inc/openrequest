// This file handles all our database operations
use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Collection {
    pub id: String,                  // Unique identifier for the collection
    pub name: String,                // Display name of the collection
    pub description: Option<String>, // optional description
    pub parent_id: Option<String>,   // optional parent collection id (for nested collections)
    pub created_at: DateTime<Utc>,   // timestamp of creation
    pub updated_at: DateTime<Utc>,   // timestamp of last update
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Request {
    pub id: String,
    pub collection_id: String, // Which collection this request belongs to
    pub name: String,          // Display name of the request
    pub method: String,        // HTTP method
    pub url: String,           // URL of the request or the API endpoint
    pub params: String,        // JSON string of query parameters
    pub headers: String,       // JSON string of headers
    pub body_type: String,     // Request body type (e.g. "json", "form-data", "raw")

    pub body_str: Option<String>, // Request body for POST, PUT, PATCH requests
    pub auth_type: Option<String>, // Authentication type (e.g. "basic", "bearer", "api-key")
    pub auth_data: Option<String>, // JSON string of auth details
    pub created_at: DateTime<Utc>, // Timestamp of creation
    pub updated_at: DateTime<Utc>, // Timestamp of last update
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Environment {
    pub id: String,
    pub name: String,              // Display name of the environment
    pub is_active: bool,           // Whether this environment is active and can be used
    pub created_at: DateTime<Utc>, // Timestamp of creation
    pub updated_at: DateTime<Utc>, // Timestamp of last update
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Variable {
    pub id: String,
    pub environment_id: Option<String>, // If None, it's a global variable
    pub key: String,                    // Variable name like "api_base_url"
    pub value: String,                  // Variable value like "https://api.example.com"
    pub is_secret: bool,                // If true, we'll hide the value in UI
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// 🎓 TEACHING: Adding Clone derive so we can clone the database connection
#[derive(Clone)]
pub struct Database {
    pool: SqlitePool,
}

impl Database {
    // Initialize the database connection
    pub async fn new(database_url: &str) -> Result<Self> {
        println!("🔧 Attempting to connect to database: {}", database_url);

        let pool = SqlitePool::connect(database_url).await.map_err(|e| {
            println!("❌ Database connection failed: {}", e);
            e
        })?;

        println!("✅ Database connection successful");

        let db = Self { pool };

        println!("🔧 Running database migrations...");
        db.run_migrations().await.map_err(|e| {
            println!("❌ Database migrations failed: {}", e);
            e
        })?;

        println!("✅ Database migrations completed successfully");
        Ok(db)
    }

    async fn run_migrations(&self) -> Result<()> {
        // Collections table - stores folders/groups of requests
        sqlx::query(
            r#"
        CREATE TABLE IF NOT EXISTS collections (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            parent_id TEXT REFERENCES collections(id),
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        "#,
        )
        .execute(&self.pool)
        .await?;

        // Requests table - stores HTTP requests
        sqlx::query(
            r#"
        CREATE TABLE IF NOT EXISTS requests (
            id TEXT PRIMARY KEY,
            collection_id TEXT NOT NULL REFERENCES collections(id),
            name TEXT NOT NULL,
            method TEXT NOT NULL,
            url TEXT NOT NULL,
            params TEXT NOT NULL DEFAULT '[]',
            headers TEXT NOT NULL DEFAULT '{}',
            body_type TEXT NOT NULL DEFAULT 'none',
            body_str TEXT,
            auth_type TEXT,
            auth_data TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        "#,
        )
        .execute(&self.pool)
        .await?;

        // Environments table - different settings like dev/prod
        sqlx::query(
            r#"
        CREATE TABLE IF NOT EXISTS environments (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            is_active BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        "#,
        )
        .execute(&self.pool)
        .await?;

        // Variables table - dynamic values like API keys
        sqlx::query(
            r#"
        CREATE TABLE IF NOT EXISTS variables (
            id TEXT PRIMARY KEY,
            environment_id TEXT REFERENCES environments(id),
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            is_secret BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(environment_id, key)
        )
        "#,
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    // Create a new collection
    pub async fn create_collection(
        &self,
        name: String,
        description: Option<String>,
        parent_id: Option<String>,
    ) -> Result<Collection> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        let collection = Collection {
            id: id.clone(),
            name,
            description,
            parent_id,
            created_at: now,
            updated_at: now,
        };

        sqlx::query(
        "INSERT INTO collections (id, name, description, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&collection.id)
    .bind(&collection.name)
    .bind(&collection.description)
    .bind(&collection.parent_id)
    .bind(collection.created_at.to_rfc3339())
    .bind(collection.updated_at.to_rfc3339())
    .execute(&self.pool)
    .await?;

        Ok(collection)
    }

    // Get all collections
    pub async fn get_collections(&self) -> Result<Vec<Collection>> {
        let rows = sqlx::query("SELECT * FROM collections ORDER BY name")
            .fetch_all(&self.pool)
            .await?;

        let mut collections = Vec::new();
        for row in rows {
            collections.push(Collection {
                id: row.get("id"),
                name: row.get("name"),
                description: row.get("description"),
                parent_id: row.get("parent_id"),
                created_at: DateTime::parse_from_rfc3339(&row.get::<String, _>("created_at"))?
                    .with_timezone(&Utc),
                updated_at: DateTime::parse_from_rfc3339(&row.get::<String, _>("updated_at"))?
                    .with_timezone(&Utc),
            });
        }

        Ok(collections)
    }

    // Create a new request
    pub async fn create_request(
        &self,
        collection_id: String,
        name: String,
        method: String,
        url: String,
    ) -> Result<Request> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        let request = Request {
            id: id.clone(),
            collection_id,
            name,
            method,
            url,
            params: "[]".to_string(),
            headers: "{}".to_string(), // Empty JSON object as default
            body_type: "none".to_string(),
            body_str: None,
            auth_type: None,
            auth_data: None,
            created_at: now,
            updated_at: now,
        };

        sqlx::query(
            "INSERT INTO requests (id, collection_id, name,method, url, params, headers, body_type, body_str,auth_type, auth_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&request.id)
        .bind(&request.collection_id)
        .bind(&request.name)
        .bind(&request.method)
        .bind(&request.url)
        .bind(&request.params)
        .bind(&request.headers)
        .bind(&request.body_type)
        .bind(&request.body_str)
        .bind(&request.auth_type)
        .bind(&request.auth_data)
        .bind(request.created_at.to_rfc3339())
        .bind(request.updated_at.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(request)
    }

    // Get requests for a specific collection
    pub async fn get_requests_by_collection(&self, collection_id: &str) -> Result<Vec<Request>> {
        let rows = sqlx::query("SELECT * FROM requests WHERE collection_id = ? ORDER BY name")
            .bind(collection_id)
            .fetch_all(&self.pool)
            .await?;

        let mut requests = Vec::new();
        for row in rows {
            requests.push(Request {
                id: row.get("id"),
                collection_id: row.get("collection_id"),
                name: row.get("name"),
                method: row.get("method"),
                url: row.get("url"),
                params: row.get("params"),
                headers: row.get("headers"),
                body_type: row.get("body_type"),
                body_str: row.get("body_str"),
                auth_type: row.get("auth_type"),
                auth_data: row.get("auth_data"),
                created_at: DateTime::parse_from_rfc3339(&row.get::<String, _>("created_at"))?
                    .with_timezone(&Utc),
                updated_at: DateTime::parse_from_rfc3339(&row.get::<String, _>("updated_at"))?
                    .with_timezone(&Utc),
            });
        }

        Ok(requests)
    }
}
