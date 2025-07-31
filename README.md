# OpenRequest 🚀

> **The Most Efficient Open Source API Testing Tool**
> A local-first, privacy-focused alternative to Postman and Insomnia built with Rust + React

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-blue.svg)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![Rust](https://img.shields.io/badge/Rust-1.70+-orange.svg)](https://www.rust-lang.org/)

## 🎯 Vision

OpenRequest aims to be the **most efficient open source alternative** to Postman and Insomnia, focusing on:

- **🔒 Local-First**: Complete privacy with offline functionality
- **⚡ Performance**: Native Rust backend for blazing speed
- **🎨 Modern UI**: Clean, intuitive React interface
- **🔧 Developer-Centric**: Built by developers, for developers
- **💰 Always Free**: Core features remain free forever
- **🌐 Future Cloud**: Optional premium cloud features for teams

---

## 🏗️ Architecture Overview

### Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Rust + Tauri 2.0
- **Database**: SQLite (local storage)
- **Scripting**: JavaScript V8 Engine
- **Authentication**: System keychain integration
- **Cross-Platform**: Windows, macOS, Linux

### Core Principles

1. **Local-First**: All data stored locally by default
2. **Privacy-Focused**: No telemetry, no tracking
3. **Performance-Optimized**: Native Rust for CPU-intensive tasks
4. **Developer-Friendly**: Keyboard shortcuts, dark mode, extensible
5. **Standards-Compliant**: Full Postman collection compatibility

---

## ⚙️ Backend API Engine Capabilities

Our backend, written in Rust, currently supports the following features for making HTTP requests:

- **[✅] HTTP Methods**: Full support for GET, POST, PUT, DELETE, PATCH, HEAD, and OPTIONS.
- **[✅] URL and Query Parameters**: Can target any URL and handles structured query parameters with automatic URL encoding.
- **[✅] Request Headers**: Full support for custom request headers.
- **[✅] Request Body**: Can send a request body as raw text.
- **[✅] Response Handling**: Captures and returns the status code, response headers, and response body.

### Future Backend Enhancements

- **Structured Authentication**: Dedicated UI and logic for Basic Auth, Bearer Token, API Key, and OAuth 2.0.
- **Advanced Request Body Types**: Support for `multipart/form-data` (file uploads) and `x-www-form-urlencoded`.
- **Cookie Management**: Automatic cookie storage and sending.
- **Advanced Connection Settings**: Connection timeouts, custom proxies, and redirect configuration.

---

## 📋 Development Roadmap

### 🔥 Phase 1: Foundation (MVP) - 4-6 weeks

**Goal**: Basic HTTP client with local storage

#### **Frontend**

- [x] Create basic UI layout structure
- [x] Set up state management (Zustand/Redux)
- [x] **Request Builder**
  - [x] URL input with autocomplete
  - [x] Headers management
  - [x] Request body editor (JSON, form-data, raw, binary)
- [x] **Response Viewer**
  - [x] Response body with syntax highlighting
  - [x] Response headers display
  - [x] Status codes and response time
  - [x] Response size tracking
- [x] **Collections Management**
  - [x] Create/edit/delete collections
  - [x] Organize requests in folders
- [x] **Authentication UI**
  - [x] UI for No Auth, Bearer Token, Basic Auth, API Key

#### **Backend**

- [x] **Core HTTP Client**
  - [x] HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
  - [x] Query parameters editor
- [x] **Local Storage System**
  - [x] Database schema design
  - [x] CRUD operations for requests
  - [x] Data persistence layer
  - [x] Basic import/export (JSON)
- [x] **Authentication**
  - [x] No Auth
  - [x] Bearer Token
  - [x] Basic Auth
  - [x] API Key (header/query param)

---

### ⚡ Phase 2: Advanced Request Features - 3-4 weeks

**Goal**: Environment management and advanced request capabilities

#### **Frontend**

- [ ] **Environment Management UI**
  - [ ] Create/edit/delete environments
  - [ ] Environment switching UI
  - [ ] Variable interpolation (`{{variable}}` syntax)
- [ ] **Advanced Authentication UI**
  - [ ] UI for OAuth 2.0, OAuth 1.0, Digest Auth, AWS Signature
- [ ] **Enhanced Response Processing UI**
  - [ ] JSON/XML pretty printing
  - [ ] Response search and filtering
  - [ ] Cookie management UI
  - [ ] Response comparison tool

#### **Backend**

- [ ] **Environment & Variables System**
  - [ ] Global vs environment variables
  - [ ] Secret variables (masked input)
  - [ ] Dynamic variables (timestamps, UUIDs)
- [ ] **Advanced Authentication**
  - [ ] OAuth 2.0 Flow (Authorization Code, Client Credentials)
  - [ ] Token refresh handling
  - [ ] OAuth 1.0, Digest Authentication, AWS Signature
- [ ] **Response Caching**

---

### 🧪 Phase 3: Testing & Automation Engine - 4-5 weeks

**Goal**: Scripting, testing, and collection runner

#### **Frontend**

- [ ] **Scripting UI**
  - [ ] Pre-request and post-response script editors
- [ ] **Testing UI**
  - [ ] Test runner UI
  - [ ] Pass/fail reporting
  - [ ] Test history tracking
- [ ] **Collection Runner UI**
- [ ] **Mock Server UI**
  - [ ] Route definition UI

#### **Backend**

- [ ] **JavaScript Scripting Environment (V8)**
  - [ ] Pre-request and post-response scripts
  - [ ] Built-in libraries (crypto, moment, lodash)
  - [ ] Environment and global variable access
- [ ] **Testing Framework**
  - [ ] Test assertions (status code, response body, headers)
  - [ ] JSON schema validation
- [ ] **Collection Runner**
  - [ ] Sequential request execution
  - [ ] Data-driven testing (CSV/JSON)
- [ ] **Mock Server**
  - [ ] Dynamic response generation
  - [ ] Request matching logic

---

### 🌐 Phase 4: Multi-Protocol Support - 4-6 weeks

**Goal**: Support for GraphQL, WebSocket, and other protocols

#### **Frontend**

- [ ] **GraphQL UI**
  - [ ] Query builder UI
  - [ ] Variables management
  - [ ] Subscription support
- [ ] **WebSocket UI**
  - [ ] Connection management
  - [ ] Message sending/receiving
- [ ] **gRPC UI**
- [ ] **Server-Sent Events (SSE) UI**
- [ ] **MQTT UI**

#### **Backend**

- [ ] **GraphQL Integration**
  - [ ] Schema introspection
- [ ] **WebSocket Support**
- [ ] **gRPC Support**
- [ ] **Server-Sent Events (SSE)**
- [ ] **MQTT Protocol**

---

### 🔧 Phase 5: Developer Tools & Utilities - 4-5 weeks

**Goal**: Code generation, documentation, and developer experience

#### **Frontend**

- [ ] **Code Generation UI**
- [ ] **Import/Export UI**
- [ ] **Documentation Generator UI**
- [ ] **Global Search UI**
- [ ] **Customizable Keyboard Shortcuts**

#### **Backend**

- [ ] **Code Generation Engine**
- [ ] **Import/Export System (Postman, Insomnia, OpenAPI)**
- [ ] **Documentation Generator**

---

### 👥 Phase 6: Collaboration & Sync - 5-6 weeks

**Goal**: Team features and data synchronization

#### **Frontend**

- [ ] **Git Integration UI**
- [ ] **File-Based Collaboration UI**
- [ ] **Security & Secrets Management UI**

#### **Backend**

- [ ] **Git Integration**
- [ ] **File System Sync**
- [ ] **Secrets Management (System Keychain, Vaults)**

---

### 📊 Phase 7: Performance & Monitoring - 3-4 weeks

**Goal**: Load testing and API monitoring

#### **Frontend**

- [ ] **Performance Testing UI**
- [ ] **API Monitoring UI**
- [ ] **Analytics & Reporting UI**

#### **Backend**

- [ ] **Performance Testing Engine**
- [ ] **API Monitoring Engine**
- [ ] **Analytics & Reporting Engine**

---

### 🤖 Phase 8: AI & Advanced Features - 4-5 weeks

**Goal**: AI-powered features and extensibility

#### **Frontend**

- [ ] **AI Integration UI**
- [ ] **Plugin System UI**
- [ ] **Advanced UI Features (Themes, Multi-tab)**

#### **Backend**

- [ ] **AI Integration**
- [ ] **Plugin Architecture**

---

## 🔮 Future Roadmap (Post-Launch)

### Cloud Features (Premium)

- [ ] **Team Collaboration**
- [ ] **Cloud Sync**
- [ ] **Enterprise Features**

### Advanced Integrations

- [ ] **CI/CD Platforms**
- [ ] **Monitoring Tools**
- [ ] **Documentation Platforms**

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- Rust 1.70+
- Tauri CLI 2.0+

### Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/openrequest.git
cd openrequest

# Install dependencies
npm install

# Start development server
npm run tauri dev

# Build for production
npm run tauri build
```

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- Extensions:
  - [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
  - [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
  - [ES7+ React/Redux/React-Native snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)

---

## 📈 Success Metrics

### Technical Goals

- [ ] **Performance**: 50% faster startup than Electron-based tools
- [ ] **Compatibility**: Import 95%+ of Postman collections without issues
- [ ] **Reliability**: 99.9% uptime for local operations
- [ ] **Size**: <100MB installation size

### User Experience Goals

- [ ] **Adoption**: 10k+ active users in first 6 months
- [ ] **Retention**: 80%+ weekly active user retention
- [ ] **Satisfaction**: 4.5+ star rating across platforms
- [ ] **Community**: 100+ GitHub stars, 20+ contributors

### Feature Completeness

- [ ] **Protocol Support**: REST, GraphQL, WebSocket, gRPC, MQTT
- [ ] **Import Support**: Postman, Insomnia, OpenAPI, cURL
- [ ] **Export Formats**: 10+ code languages, multiple documentation formats
- [ ] **Platform Support**: Windows, macOS, Linux

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Phases Priority

1. **Phase 1-3**: Critical for MVP launch
2. **Phase 4-5**: Essential for competitive parity
3. **Phase 6-8**: Advanced features and differentiation

### How to Contribute

- Pick a feature from the roadmap
- Create a feature branch
- Implement with tests
- Submit a pull request
- Update this README with progress

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌟 Support the Project

If you find OpenRequest useful, please:

- ⭐ Star the repository
- 🐛 Report bugs and suggest features
- 🔀 Submit pull requests
- 📢 Share with your developer community

---

**Built with ❤️ by developers, for developers**

> **Note**: This is an active development project. Features will be implemented in the order listed above. Check the issues page for current progress and ways to contribute.
