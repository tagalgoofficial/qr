/**
 * API Service - Base API Functions
 * 
 * NOTE: Do not add console.log statements in this file.
 * All debug logging should be removed before production.
 */
import API_CONFIG from '../config';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  /**
   * Set Auth Token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Get Auth Token
   */
  getToken() {
    return this.token || localStorage.getItem('auth_token');
  }

  /**
   * Build URL
   * Handles both relative and absolute URLs
   */
  buildURL(endpoint) {
    // If baseURL is relative, just concatenate
    if (this.baseURL.startsWith('/')) {
      return `${this.baseURL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    }
    // If baseURL is absolute, use it as is
    return `${this.baseURL}${endpoint}`;
  }

  /**
   * Get Headers
   */
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.getToken()) {
      headers['Authorization'] = `Bearer ${this.getToken()}`;
    }

    return headers;
  }

  /**
   * Handle Response
   */
  async handleResponse(response) {
    // Handle empty responses (some endpoints might return empty)
    let data = {};
    
    // Check if response is HTML (usually means wrong URL or 404)
    const contentType = response.headers.get('content-type') || '';
    const isHTML = contentType.includes('text/html') || contentType.includes('application/xhtml');
    
    // Try to parse as JSON regardless of content-type (sometimes PHP sends text/html but content is JSON)
    try {
      const text = await response.text();
      
      if (text && text.trim()) {
        // Check if response is PHP code (not executed)
        if (text.trim().startsWith('<?php') || text.trim().startsWith('<?PHP')) {
          console.error('⚠️ CRITICAL: Received PHP code instead of JSON. PHP is not being executed!');
          console.error('This means:');
          console.error('1. PHP is not configured correctly on the server');
          console.error('2. The file path is incorrect (direct file access instead of execution)');
          console.error('3. Apache/PHP module is not enabled');
          console.error('Response URL:', response.url);
          console.error('Response status:', response.status);
          console.error('PHP code received:', text.substring(0, 300));
          
          const error = new Error('PHP is not being executed. Check server configuration. The API endpoint returned PHP code instead of JSON.');
          error.status = response.status || 500;
          error.response = { status: response.status, data: { phpCode: text.substring(0, 500) } };
          error.data = { phpCode: text.substring(0, 500), message: 'PHP execution failed' };
          throw error;
        }
        
        // Check if response is HTML (error page)
        if (isHTML || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          console.error('Received HTML instead of JSON. This usually means:');
          console.error('1. The API endpoint URL is incorrect');
          console.error('2. The server is not configured correctly');
          console.error('3. CORS or routing issue');
          console.error('Response URL:', response.url);
          console.error('Response status:', response.status);
          
          const error = new Error('Server returned HTML instead of JSON. Check API endpoint configuration.');
          error.status = response.status;
          error.response = { status: response.status, data: { html: text.substring(0, 500) } };
          error.data = { html: text.substring(0, 500) };
          throw error;
        }
        
        // Try to parse as JSON
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          // If JSON parsing fails, log and return empty object
          console.error('JSON parse error:', parseError, 'Text:', text.substring(0, 200));
          data = {};
        }
      } else {
        console.warn('Empty response text');
      }
    } catch (e) {
      // Re-throw if it's our custom error
      if (e.message && e.message.includes('Server returned HTML')) {
        throw e;
      }
      // Error reading response, return empty object
      console.error('Error reading response:', e);
      data = {};
    }

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Request failed');
      error.status = response.status;
      error.response = { status: response.status, data };
      error.data = data;
      console.error('Response not OK:', response.status, data);
      throw error;
    }

    // Return the full response object (which includes data, success, message)
    // Removed console.log to reduce console noise - only log errors
    return data;
  }

  /**
   * GET Request
   */
  async get(endpoint, params = {}, includeAuth = true) {
    let urlString = this.buildURL(endpoint);
    
    // Handle query parameters for relative URLs
    const paramsArray = [];
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        paramsArray.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
      }
    });
    
    if (paramsArray.length > 0) {
      const separator = urlString.includes('?') ? '&' : '?';
      urlString += separator + paramsArray.join('&');
    }

    try {
      const response = await fetch(urlString, {
        method: 'GET',
        headers: this.getHeaders(includeAuth),
      });

      return this.handleResponse(response);
    } catch (error) {
      // Re-throw network errors
      throw error;
    }
  }

  /**
   * POST Request
   */
  async post(endpoint, data = {}, includeAuth = true) {
    const response = await fetch(this.buildURL(endpoint), {
      method: 'POST',
      headers: this.getHeaders(includeAuth),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  /**
   * PUT Request
   */
  async put(endpoint, data = {}, includeAuth = true) {
    const url = this.buildURL(endpoint);
    const body = JSON.stringify(data);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(includeAuth),
      body: body,
    });

    return this.handleResponse(response);
  }

  /**
   * PATCH Request
   */
  async patch(endpoint, data = {}, includeAuth = true) {
    const response = await fetch(this.buildURL(endpoint), {
      method: 'PATCH',
      headers: this.getHeaders(includeAuth),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  /**
   * DELETE Request
   */
  async delete(endpoint, params = {}, includeAuth = true) {
    let urlString = this.buildURL(endpoint);
    
    // Handle query parameters for relative URLs
    const paramsArray = [];
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        paramsArray.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
      }
    });
    
    if (paramsArray.length > 0) {
      const separator = urlString.includes('?') ? '&' : '?';
      urlString += separator + paramsArray.join('&');
    }

    const response = await fetch(urlString, {
      method: 'DELETE',
      headers: this.getHeaders(includeAuth),
    });

    return this.handleResponse(response);
  }

  /**
   * Upload File
   */
  async uploadFile(endpoint, file, folder = 'general') {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    const headers = {};
    if (this.getToken()) {
      headers['Authorization'] = `Bearer ${this.getToken()}`;
    }

    const response = await fetch(this.buildURL(endpoint), {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    return this.handleResponse(response);
  }
}

// Export singleton instance
export default new ApiService();
