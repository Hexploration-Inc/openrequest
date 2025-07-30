# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenRequest is a local-first, privacy-focused API testing tool built with Tauri 2.0. It's designed as an open-source alternative to Postman and Insomnia, combining a React frontend with a Rust backend for performance and native system integration.

## Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Rust + Tauri 2.0 
- **Database**: SQLite (local storage via sqlx)
- **HTTP Client**: reqwest (Rust)
- **UI Components**: Custom components built with Radix UI primitives

### Key Architecture Patterns
- **Tauri Commands**: All backend functionality is exposed through Tauri commands that can be invoked from the frontend using `invoke()`
- **Database State Management**: Database connection is managed as shared state (`DatabaseState`) wrapped in a Mutex for thread safety
- **Type Safety**: Rust structs are mirrored as TypeScript interfaces for frontend-backend communication

## Common Development Commands

```bash
# Start development server (frontend + Tauri)
npm run dev
# or 
pnpm dev

# Build for production
npm run build

# Build Tauri app
npm run tauri build

# Run Rust tests
cd src-tauri && cargo test

# Development with specific Tauri commands
npm run tauri dev
```

## Project Structure

```
src/                    # React frontend
  components/
    ui/                 # Reusable UI components (button, input, card, etc.)
    Collections/        # Collection management components
    RequestBuilder/     # HTTP request builder components
  lib/                  # Utility functions
  App.tsx              # Main application component

src-tauri/             # Rust backend
  src/
    lib.rs             # Main Tauri commands and application logic
    database.rs        # SQLite database operations and models
    importer_exporter.rs # JSON import/export functionality
    main.rs            # Application entry point
  tauri.conf.json      # Tauri configuration
```

## Core Features Implemented

### HTTP Request Engine
- Full HTTP method support (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- Query parameters with automatic URL encoding
- Custom request headers
- Request body support (raw text)
- Response handling (status, headers, body)

### Authentication Support
- No Auth
- Bearer Token authentication
- Basic Auth (username/password)
- API Key authentication (header or query parameter)

### Data Management
- SQLite database for local storage
- Collections and requests CRUD operations
- JSON import/export functionality
- Thread-safe database state management

## Database Schema

The application uses SQLite with the following key entities:
- `collections`: Groups of related requests
- `requests`: Individual HTTP requests with full configuration
- Foreign key relationships between collections and requests

## Development Notes

### Tauri Command Pattern
All backend functionality follows this pattern:
```rust
#[tauri::command]
async fn command_name(
    params: Type,
    db_state: State<'_, DatabaseState>
) -> Result<ReturnType, String> {
    // Extract database from mutex guard
    let db = {
        let db_guard = db_state.lock().unwrap();
        db_guard.as_ref().ok_or("Database not initialized")?.clone()
    };
    
    // Perform async operation
    db.operation().await.map_err(|e| e.to_string())
}
```

### Frontend-Backend Communication
- Use `invoke()` from `@tauri-apps/api/core` to call Rust commands
- TypeScript interfaces mirror Rust structs for type safety
- Error handling uses Result<T, String> pattern

### Testing
- Rust integration tests in `src-tauri/src/lib.rs`
- Tests cover HTTP client functionality and authentication
- Database operations tested through command functions

## Current Development Phase

The project is in Phase 1 (Foundation/MVP) with:
- ✅ Basic HTTP client with all methods
- ✅ Local SQLite storage
- ✅ Collections and requests management
- ✅ Basic authentication (Bearer, Basic, API Key)
- ✅ Import/export functionality

Next phases focus on environment management, advanced authentication, testing framework, and multi-protocol support.