#Directus MCP Server

A Model Context Protocol (MCP) server for Directus CMS that provides seamless integration with AI assistants like Claude.

## Features

- Full CRUD operations for Directus collections
- Advanced querying with filtering and pagination
- Search functionality across collections
- Secure authentication with static tokens
- Error handling and logging

## Installation

### Option 1: Install from GitHub (Recommended)
```bash
npx directus-mcp-server
Option 2: Clone and Run Locally
bashgit clone https://github.com/YOUR_USERNAME/directus-mcp-server.git
cd directus-mcp-server
npm install
npm start
```
### Configuration
Set your environment variables:
```
bashexport DIRECTUS_URL="https://your-directus-instance.com"
export DIRECTUS_TOKEN="your-directus-static-token"
```

Usage with Claude Desktop
Add to your Claude Desktop configuration:
```json{
  "mcpServers": {
    "directus": {
      "command": "npx",
      "args": ["directus-mcp-server"],
      "env": {
        "DIRECTUS_URL": "https://your-directus-instance.com",
        "DIRECTUS_TOKEN": "your-directus-static-token"
      }
    }
  }
}
```

## Available Tools
- list_collections - List all collections
- get_collection_items - Get items with filtering/pagination
- get_item - Get specific item by ID
- create_item - Create new items
- update_item - Update existing items
- delete_item - Delete items
- search_items - Search within collections
