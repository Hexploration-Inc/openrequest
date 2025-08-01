// Core types matching the backend Rust structs
export interface Collection {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Request {
  id: string;
  collection_id: string;
  name: string;
  method: string;
  url: string;
  headers: string;
  params: string;
  body_type?: string;
  body_str?: string;
  auth_type?: string;
  auth_data?: string;
  created_at: string;
  updated_at: string;
}

// Frontend-specific types
export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface ApiResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  responseTime?: number;
  size?: number;
}

export interface AuthConfig {
  type: 'none' | 'bearer' | 'basic' | 'api-key' | 'oauth2' | 'oauth1' | 'digest' | 'aws-signature';
  data: Record<string, string>;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type BodyType = 'none' | 'json' | 'xml' | 'html' | 'text' | 'javascript' | 'form-data' | 'x-www-form-urlencoded';

// Environment Management types
export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
  isActive?: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  isSecret?: boolean;
}