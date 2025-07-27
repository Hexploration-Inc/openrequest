// 🎓 TEACHING: This module handles the import and export of collections to and from JSON format.
// We define separate structs for the JSON format to decouple it from our internal database schema.
// This means if we change our database in the future, our import/export format can remain stable.

use serde::{Deserialize, Serialize};

// The structure for a request within the JSON file.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JsonRequest {
    pub name: String,
    pub method: String,
    pub url: String,
    pub params: String,
    pub headers: String,
    pub body_type: String,
    pub body_str: Option<String>,
    pub auth_type: Option<String>,
    pub auth_data: Option<String>,
}

// The main structure for a collection export, containing the collection details
// and a list of all its requests.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JsonCollection {
    pub name: String,
    pub description: Option<String>,
    pub requests: Vec<JsonRequest>,
}
