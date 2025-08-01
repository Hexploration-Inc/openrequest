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

// 🎓 TEACHING: Response Cache for Phase 2
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ResponseCache {
    pub id: String,
    pub request_hash: String,           // Hash of the request (method + url + headers + body)
    pub method: String,                 // HTTP method
    pub url: String,                    // Request URL
    pub response_status: u16,           // HTTP status code
    pub response_headers: String,       // JSON string of response headers
    pub response_body: String,          // Response body
    pub cache_time: DateTime<Utc>,      // When this was cached
    pub expires_at: Option<DateTime<Utc>>, // When this cache expires (optional)
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

        // Response cache table - cached API responses
        sqlx::query(
            r#"
        CREATE TABLE IF NOT EXISTS response_cache (
            id TEXT PRIMARY KEY,
            request_hash TEXT UNIQUE NOT NULL,
            method TEXT NOT NULL,
            url TEXT NOT NULL,
            response_status INTEGER NOT NULL,
            response_headers TEXT NOT NULL,
            response_body TEXT NOT NULL,
            cache_time TEXT NOT NULL,
            expires_at TEXT
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

    // 🎓 TEACHING: This function updates an existing collection in the database.
    pub async fn update_collection(&self, collection: Collection) -> Result<Collection> {
        let now = Utc::now();
        let updated_collection = Collection {
            updated_at: now,
            ..collection
        };

        sqlx::query(
            r#"
            UPDATE collections
            SET name = ?, description = ?, parent_id = ?, updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(&updated_collection.name)
        .bind(&updated_collection.description)
        .bind(&updated_collection.parent_id)
        .bind(updated_collection.updated_at.to_rfc3339())
        .bind(&updated_collection.id)
        .execute(&self.pool)
        .await?;

        Ok(updated_collection)
    }

    // 🎓 TEACHING: This function deletes a collection from the database.
    // It takes the `id` of the collection to be deleted as input.
    // It also deletes all the requests associated with this collection.
    pub async fn delete_collection(&self, id: &str) -> Result<()> {
        println!("🗑️ DB: delete_collection called with id: {}", id);
        
        // First, delete all requests in the collection
        println!("🔄 DB: Deleting requests for collection...");
        let requests_result = sqlx::query("DELETE FROM requests WHERE collection_id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        println!("✅ DB: Deleted {} requests", requests_result.rows_affected());

        // Then, delete the collection itself
        println!("🔄 DB: Deleting collection...");
        let collection_result = sqlx::query("DELETE FROM collections WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        println!("✅ DB: Deleted {} collection(s)", collection_result.rows_affected());

        Ok(())
    }

    // 🎓 TEACHING: This function retrieves a single collection from the database by its ID.
    pub async fn get_collection_by_id(&self, id: &str) -> Result<Option<Collection>> {
        let row = sqlx::query("SELECT * FROM collections WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        if let Some(row) = row {
            Ok(Some(Collection {
                id: row.get("id"),
                name: row.get("name"),
                description: row.get("description"),
                parent_id: row.get("parent_id"),
                created_at: DateTime::parse_from_rfc3339(&row.get::<String, _>("created_at"))?
                    .with_timezone(&Utc),
                updated_at: DateTime::parse_from_rfc3339(&row.get::<String, _>("updated_at"))?
                    .with_timezone(&Utc),
            }))
        } else {
            Ok(None)
        }
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

    // 🎓 TEACHING: This function updates an existing request in the database.
    // It takes a `Request` struct as input, which contains the new data.
    // The `id` field of the `Request` struct is used to identify the request to be updated.
    // We also update the `updated_at` timestamp to the current time.
    pub async fn update_request(&self, request: Request) -> Result<Request> {
        let now = Utc::now();
        let updated_request = Request {
            updated_at: now,
            ..request
        };

        sqlx::query(
            r#"
            UPDATE requests
            SET collection_id = ?, name = ?, method = ?, url = ?, params = ?, headers = ?, body_type = ?, body_str = ?, auth_type = ?, auth_data = ?, updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(&updated_request.collection_id)
        .bind(&updated_request.name)
        .bind(&updated_request.method)
        .bind(&updated_request.url)
        .bind(&updated_request.params)
        .bind(&updated_request.headers)
        .bind(&updated_request.body_type)
        .bind(&updated_request.body_str)
        .bind(&updated_request.auth_type)
        .bind(&updated_request.auth_data)
        .bind(updated_request.updated_at.to_rfc3339())
        .bind(&updated_request.id)
        .execute(&self.pool)
        .await?;

        Ok(updated_request)
    }

    // 🎓 TEACHING: This function deletes a request from the database.
    // It takes the `id` of the request to be deleted as input.
    pub async fn delete_request(&self, id: &str) -> Result<()> {
        println!("🗑️ DB: delete_request called with id: {}", id);
        
        println!("🔄 DB: Deleting request...");
        let result = sqlx::query("DELETE FROM requests WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        println!("✅ DB: Deleted {} request(s)", result.rows_affected());

        Ok(())
    }

    // 🎓 TEACHING: This function retrieves a single request from the database by its ID.
    // It takes the `id` of the request to be retrieved as input.
    pub async fn get_request_by_id(&self, id: &str) -> Result<Option<Request>> {
        let row = sqlx::query("SELECT * FROM requests WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        if let Some(row) = row {
            Ok(Some(Request {
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
            }))
        } else {
            Ok(None)
        }
    }

    // ============ PHASE 2: ENVIRONMENT MANAGEMENT ============
    
    // 🎓 TEACHING: Create a new environment
    // Environments help organize variables for different stages (dev, prod, staging)
    pub async fn create_environment(&self, name: String) -> Result<Environment> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        let environment = Environment {
            id: id.clone(),
            name,
            is_active: false, // New environments start inactive
            created_at: now,
            updated_at: now,
        };

        sqlx::query(
            "INSERT INTO environments (id, name, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
        )
        .bind(&environment.id)
        .bind(&environment.name)
        .bind(environment.is_active)
        .bind(environment.created_at.to_rfc3339())
        .bind(environment.updated_at.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(environment)
    }

    // 🎓 TEACHING: Get all environments
    pub async fn get_environments(&self) -> Result<Vec<Environment>> {
        let rows = sqlx::query("SELECT * FROM environments ORDER BY name")
            .fetch_all(&self.pool)
            .await?;

        let mut environments = Vec::new();
        for row in rows {
            environments.push(Environment {
                id: row.get("id"),
                name: row.get("name"),
                is_active: row.get("is_active"),
                created_at: DateTime::parse_from_rfc3339(&row.get::<String, _>("created_at"))?
                    .with_timezone(&Utc),
                updated_at: DateTime::parse_from_rfc3339(&row.get::<String, _>("updated_at"))?
                    .with_timezone(&Utc),
            });
        }

        Ok(environments)
    }

    // 🎓 TEACHING: Set an environment as active (and deactivate others)
    pub async fn set_active_environment(&self, id: &str) -> Result<Environment> {
        let now = Utc::now();

        // First, deactivate all environments
        sqlx::query("UPDATE environments SET is_active = FALSE, updated_at = ?")
            .bind(now.to_rfc3339())
            .execute(&self.pool)
            .await?;

        // Then, activate the selected environment
        sqlx::query("UPDATE environments SET is_active = TRUE, updated_at = ? WHERE id = ?")
            .bind(now.to_rfc3339())
            .bind(id)
            .execute(&self.pool)
            .await?;

        // Return the updated environment
        self.get_environment_by_id(id).await?.ok_or_else(|| {
            anyhow::anyhow!("Environment not found after activation")
        })
    }

    // 🎓 TEACHING: Clear active environment (deactivate all environments)
    pub async fn clear_active_environment(&self) -> Result<()> {
        let now = Utc::now();

        // Deactivate all environments
        sqlx::query("UPDATE environments SET is_active = FALSE, updated_at = ?")
            .bind(now.to_rfc3339())
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    // 🎓 TEACHING: Get environment by ID
    pub async fn get_environment_by_id(&self, id: &str) -> Result<Option<Environment>> {
        let row = sqlx::query("SELECT * FROM environments WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        if let Some(row) = row {
            Ok(Some(Environment {
                id: row.get("id"),
                name: row.get("name"),
                is_active: row.get("is_active"),
                created_at: DateTime::parse_from_rfc3339(&row.get::<String, _>("created_at"))?
                    .with_timezone(&Utc),
                updated_at: DateTime::parse_from_rfc3339(&row.get::<String, _>("updated_at"))?
                    .with_timezone(&Utc),
            }))
        } else {
            Ok(None)
        }
    }

    // 🎓 TEACHING: Update environment
    pub async fn update_environment(&self, environment: Environment) -> Result<Environment> {
        let now = Utc::now();
        let updated_environment = Environment {
            updated_at: now,
            ..environment
        };

        sqlx::query("UPDATE environments SET name = ?, is_active = ?, updated_at = ? WHERE id = ?")
            .bind(&updated_environment.name)
            .bind(updated_environment.is_active)
            .bind(updated_environment.updated_at.to_rfc3339())
            .bind(&updated_environment.id)
            .execute(&self.pool)
            .await?;

        Ok(updated_environment)
    }

    // 🎓 TEACHING: Delete environment (and all its variables)
    pub async fn delete_environment(&self, id: &str) -> Result<()> {
        // First, delete all variables in this environment
        sqlx::query("DELETE FROM variables WHERE environment_id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        // Then, delete the environment itself
        sqlx::query("DELETE FROM environments WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    // ============ PHASE 2: VARIABLE MANAGEMENT ============

    // 🎓 TEACHING: Create a new variable
    // Variables can be global (environment_id = None) or environment-specific
    pub async fn create_variable(
        &self,
        environment_id: Option<String>,
        key: String,
        value: String,
        is_secret: bool,
    ) -> Result<Variable> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();

        let variable = Variable {
            id: id.clone(),
            environment_id,
            key,
            value,
            is_secret,
            created_at: now,
            updated_at: now,
        };

        sqlx::query(
            "INSERT INTO variables (id, environment_id, key, value, is_secret, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&variable.id)
        .bind(&variable.environment_id)
        .bind(&variable.key)
        .bind(&variable.value)
        .bind(variable.is_secret)
        .bind(variable.created_at.to_rfc3339())
        .bind(variable.updated_at.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(variable)
    }

    // 🎓 TEACHING: Get all variables for an environment (or global variables if environment_id is None)
    pub async fn get_variables(&self, environment_id: Option<&str>) -> Result<Vec<Variable>> {
        let rows = if let Some(env_id) = environment_id {
            sqlx::query("SELECT * FROM variables WHERE environment_id = ? ORDER BY key")
                .bind(env_id)
                .fetch_all(&self.pool)
                .await?
        } else {
            sqlx::query("SELECT * FROM variables WHERE environment_id IS NULL ORDER BY key")
                .fetch_all(&self.pool)
                .await?
        };

        let mut variables = Vec::new();
        for row in rows {
            variables.push(Variable {
                id: row.get("id"),
                environment_id: row.get("environment_id"),
                key: row.get("key"),
                value: row.get("value"),
                is_secret: row.get("is_secret"),
                created_at: DateTime::parse_from_rfc3339(&row.get::<String, _>("created_at"))?
                    .with_timezone(&Utc),
                updated_at: DateTime::parse_from_rfc3339(&row.get::<String, _>("updated_at"))?
                    .with_timezone(&Utc),
            });
        }

        Ok(variables)
    }

    // 🎓 TEACHING: Get all variables (global + active environment)
    pub async fn get_active_variables(&self) -> Result<Vec<Variable>> {
        // Get global variables
        let mut variables = self.get_variables(None).await?;
        
        // Get active environment variables
        if let Some(active_env) = self.get_active_environment().await? {
            let env_variables = self.get_variables(Some(&active_env.id)).await?;
            variables.extend(env_variables);
        }

        Ok(variables)
    }

    // 🎓 TEACHING: Get the currently active environment
    pub async fn get_active_environment(&self) -> Result<Option<Environment>> {
        let row = sqlx::query("SELECT * FROM environments WHERE is_active = TRUE LIMIT 1")
            .fetch_optional(&self.pool)
            .await?;

        if let Some(row) = row {
            Ok(Some(Environment {
                id: row.get("id"),
                name: row.get("name"),
                is_active: row.get("is_active"),
                created_at: DateTime::parse_from_rfc3339(&row.get::<String, _>("created_at"))?
                    .with_timezone(&Utc),
                updated_at: DateTime::parse_from_rfc3339(&row.get::<String, _>("updated_at"))?
                    .with_timezone(&Utc),
            }))
        } else {
            Ok(None)
        }
    }

    // 🎓 TEACHING: Update a variable
    pub async fn update_variable(&self, variable: Variable) -> Result<Variable> {
        let now = Utc::now();
        let updated_variable = Variable {
            updated_at: now,
            ..variable
        };

        sqlx::query(
            "UPDATE variables SET environment_id = ?, key = ?, value = ?, is_secret = ?, updated_at = ? WHERE id = ?"
        )
        .bind(&updated_variable.environment_id)
        .bind(&updated_variable.key)
        .bind(&updated_variable.value)
        .bind(updated_variable.is_secret)
        .bind(updated_variable.updated_at.to_rfc3339())
        .bind(&updated_variable.id)
        .execute(&self.pool)
        .await?;

        Ok(updated_variable)
    }

    // 🎓 TEACHING: Delete a variable
    pub async fn delete_variable(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM variables WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    // 🎓 TEACHING: Variable interpolation - replace {{variable}} syntax with actual values
    pub async fn interpolate_string(&self, input: &str) -> Result<String> {
        let variables = self.get_active_variables().await?;
        let mut result = input.to_string();

        // Simple regex-like replacement for {{variable}} syntax
        for variable in variables {
            let placeholder = format!("{{{{{}}}}}", variable.key);
            result = result.replace(&placeholder, &variable.value);
        }

        Ok(result)
    }

    // ============ PHASE 2: RESPONSE CACHING ============

    // 🎓 TEACHING: Generate a hash for a request to use as cache key
    pub fn generate_request_hash(method: &str, url: &str, headers: &str, body: &str) -> String {
        use sha2::{Digest, Sha256};
        let input = format!("{}:{}:{}:{}", method, url, headers, body);
        format!("{:x}", Sha256::digest(input.as_bytes()))
    }

    // 🎓 TEACHING: Store a response in cache
    pub async fn cache_response(
        &self,
        method: String,
        url: String,
        headers: String,
        body: String,
        response_status: u16,
        response_headers: String,
        response_body: String,
        cache_duration_seconds: Option<u64>,
    ) -> Result<ResponseCache> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();
        let request_hash = Self::generate_request_hash(&method, &url, &headers, &body);
        
        let expires_at = cache_duration_seconds.map(|duration| now + chrono::Duration::seconds(duration as i64));

        let cache_entry = ResponseCache {
            id: id.clone(),
            request_hash: request_hash.clone(),
            method,
            url,
            response_status,
            response_headers,
            response_body,
            cache_time: now,
            expires_at,
        };

        // Use REPLACE to handle hash collisions (update existing cache)
        sqlx::query(
            r#"
            REPLACE INTO response_cache 
            (id, request_hash, method, url, response_status, response_headers, response_body, cache_time, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&cache_entry.id)
        .bind(&cache_entry.request_hash)
        .bind(&cache_entry.method)
        .bind(&cache_entry.url)
        .bind(cache_entry.response_status as i64)
        .bind(&cache_entry.response_headers)
        .bind(&cache_entry.response_body)
        .bind(cache_entry.cache_time.to_rfc3339())
        .bind(cache_entry.expires_at.as_ref().map(|dt| dt.to_rfc3339()))
        .execute(&self.pool)
        .await?;

        Ok(cache_entry)
    }

    // 🎓 TEACHING: Get a cached response if it exists and is not expired
    pub async fn get_cached_response(
        &self,
        method: &str,
        url: &str,
        headers: &str,
        body: &str,
    ) -> Result<Option<ResponseCache>> {
        let request_hash = Self::generate_request_hash(method, url, headers, body);
        let now = Utc::now();

        let row = sqlx::query(
            r#"
            SELECT * FROM response_cache 
            WHERE request_hash = ? 
            AND (expires_at IS NULL OR expires_at > ?)
            "#,
        )
        .bind(&request_hash)
        .bind(now.to_rfc3339())
        .fetch_optional(&self.pool)
        .await?;

        if let Some(row) = row {
            Ok(Some(ResponseCache {
                id: row.get("id"),
                request_hash: row.get("request_hash"),
                method: row.get("method"),
                url: row.get("url"),
                response_status: row.get::<i64, _>("response_status") as u16,
                response_headers: row.get("response_headers"),
                response_body: row.get("response_body"),
                cache_time: DateTime::parse_from_rfc3339(&row.get::<String, _>("cache_time"))?
                    .with_timezone(&Utc),
                expires_at: row.get::<Option<String>, _>("expires_at")
                    .map(|s| DateTime::parse_from_rfc3339(&s))
                    .transpose()?
                    .map(|dt| dt.with_timezone(&Utc)),
            }))
        } else {
            Ok(None)
        }
    }

    // 🎓 TEACHING: Clear expired cache entries
    pub async fn clear_expired_cache(&self) -> Result<u64> {
        let now = Utc::now();
        let result = sqlx::query("DELETE FROM response_cache WHERE expires_at IS NOT NULL AND expires_at <= ?")
            .bind(now.to_rfc3339())
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected())
    }

    // 🎓 TEACHING: Clear all cache entries
    pub async fn clear_all_cache(&self) -> Result<u64> {
        let result = sqlx::query("DELETE FROM response_cache")
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected())
    }

    // 🎓 TEACHING: Get cache statistics
    pub async fn get_cache_stats(&self) -> Result<(u64, u64)> {
        let total_row = sqlx::query("SELECT COUNT(*) as total FROM response_cache")
            .fetch_one(&self.pool)
            .await?;
        let total: i64 = total_row.get("total");

        let now = Utc::now();
        let expired_row = sqlx::query(
            "SELECT COUNT(*) as expired FROM response_cache WHERE expires_at IS NOT NULL AND expires_at <= ?"
        )
        .bind(now.to_rfc3339())
        .fetch_one(&self.pool)
        .await?;
        let expired: i64 = expired_row.get("expired");

        Ok((total as u64, expired as u64))
    }

    // 🎓 TEACHING: Get cached response by hash directly
    pub async fn get_cached_response_by_hash(&self, request_hash: &str) -> Result<Option<ResponseCache>> {
        let row = sqlx::query("SELECT * FROM response_cache WHERE request_hash = ?")
            .bind(request_hash)
            .fetch_optional(&self.pool)
            .await?;

        if let Some(row) = row {
            Ok(Some(ResponseCache {
                id: row.get("id"),
                request_hash: row.get("request_hash"),
                method: row.get("method"),
                url: row.get("url"),
                response_status: row.get::<i64, _>("response_status") as u16,
                response_headers: row.get("response_headers"),
                response_body: row.get("response_body"),
                cache_time: DateTime::parse_from_rfc3339(&row.get::<String, _>("cache_time"))?
                    .with_timezone(&Utc),
                expires_at: row.get::<Option<String>, _>("expires_at")
                    .map(|s| DateTime::parse_from_rfc3339(&s))
                    .transpose()?
                    .map(|dt| dt.with_timezone(&Utc)),
            }))
        } else {
            Ok(None)
        }
    }
}
