#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { createDirectus, rest, staticToken, readCollections, readItems, readItem, createItem, updateItem, deleteItem } = require('@directus/sdk');

class DirectusMCPServer {
    constructor() {
        this.server = new Server(
            {
                name: 'directus-mcp-server',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.directus = null;
        this.setupToolHandlers();
    }

    async initializeDirectus() {
        const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
        const directusToken = process.env.DIRECTUS_TOKEN;
        const directusEmail = process.env.DIRECTUS_EMAIL;
        const directusPassword = process.env.DIRECTUS_PASSWORD;

        console.error(`Connecting to Directus at: ${directusUrl}`);

        try {
            if (directusToken) {
                console.error('Using static token authentication');
                this.directus = createDirectus(directusUrl)
                    .with(rest())
                    .with(staticToken(directusToken));
            } else if (directusEmail && directusPassword) {
                console.error('Email/password authentication not implemented yet. Please use DIRECTUS_TOKEN');
                process.exit(1);
            } else {
                console.error('No authentication method provided. Set DIRECTUS_TOKEN or DIRECTUS_EMAIL/DIRECTUS_PASSWORD');
                process.exit(1);
            }
            
            // Test the connection by trying to read collections
            const testCollections = await this.directus.request(readCollections());
            console.error(`Successfully connected to Directus. Found ${testCollections.length} collections.`);
        } catch (error) {
            console.error('Failed to authenticate with Directus:', error.message);
            console.error('Error details:', error);
            process.exit(1);
        }
    }

    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'list_collections',
                        description: 'List all collections in Directus',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                        },
                    },
                    {
                        name: 'get_collection_items',
                        description: 'Get items from a specific collection',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                collection: {
                                    type: 'string',
                                    description: 'The collection name',
                                },
                                limit: {
                                    type: 'number',
                                    description: 'Number of items to retrieve (default: 10)',
                                    default: 10,
                                },
                                offset: {
                                    type: 'number',
                                    description: 'Number of items to skip (default: 0)',
                                    default: 0,
                                },
                                filter: {
                                    type: 'object',
                                    description: 'Filter object for querying items',
                                },
                                fields: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'Specific fields to retrieve',
                                },
                            },
                            required: ['collection'],
                        },
                    },
                    {
                        name: 'get_item',
                        description: 'Get a specific item by ID',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                collection: {
                                    type: 'string',
                                    description: 'The collection name',
                                },
                                id: {
                                    type: 'string',
                                    description: 'The item ID',
                                },
                                fields: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'Specific fields to retrieve',
                                },
                            },
                            required: ['collection', 'id'],
                        },
                    },
                    {
                        name: 'create_item',
                        description: 'Create a new item in a collection',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                collection: {
                                    type: 'string',
                                    description: 'The collection name',
                                },
                                data: {
                                    type: 'object',
                                    description: 'The item data to create',
                                },
                            },
                            required: ['collection', 'data'],
                        },
                    },
                    {
                        name: 'update_item',
                        description: 'Update an existing item',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                collection: {
                                    type: 'string',
                                    description: 'The collection name',
                                },
                                id: {
                                    type: 'string',
                                    description: 'The item ID',
                                },
                                data: {
                                    type: 'object',
                                    description: 'The data to update',
                                },
                            },
                            required: ['collection', 'id', 'data'],
                        },
                    },
                    {
                        name: 'delete_item',
                        description: 'Delete an item',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                collection: {
                                    type: 'string',
                                    description: 'The collection name',
                                },
                                id: {
                                    type: 'string',
                                    description: 'The item ID',
                                },
                            },
                            required: ['collection', 'id'],
                        },
                    },
                    {
                        name: 'search_items',
                        description: 'Search for items across collections',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                collection: {
                                    type: 'string',
                                    description: 'The collection name',
                                },
                                query: {
                                    type: 'string',
                                    description: 'Search query',
                                },
                                fields: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'Fields to search in',
                                },
                                limit: {
                                    type: 'number',
                                    description: 'Number of results to return',
                                    default: 10,
                                },
                            },
                            required: ['collection', 'query'],
                        },
                    },
                ],
            };
        });

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                switch (name) {
                    case 'list_collections':
                        return await this.listCollections();
                    
                    case 'get_collection_items':
                        return await this.getCollectionItems(args);
                    
                    case 'get_item':
                        return await this.getItem(args);
                    
                    case 'create_item':
                        return await this.createItem(args);
                    
                    case 'update_item':
                        return await this.updateItem(args);
                    
                    case 'delete_item':
                        return await this.deleteItem(args);
                    
                    case 'search_items':
                        return await this.searchItems(args);
                    
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error.message}`,
                        },
                    ],
                };
            }
        });
    }

    async listCollections() {
        try {
            const collections = await this.directus.request(readCollections());
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(collections, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error('Error listing collections:', error);
            throw new Error(`Failed to list collections: ${error.message}`);
        }
    }

    async getCollectionItems(args) {
        try {
            const { collection, limit = 10, offset = 0, filter, fields } = args;
            
            const query = {
                limit,
                offset,
                ...(filter && { filter }),
                ...(fields && { fields }),
            };

            const items = await this.directus.request(readItems(collection, query));
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(items, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error('Error getting collection items:', error);
            throw new Error(`Failed to get items from collection ${args.collection}: ${error.message}`);
        }
    }

    async getItem(args) {
        try {
            const { collection, id, fields } = args;
            
            const query = fields ? { fields } : {};
            const item = await this.directus.request(readItem(collection, id, query));
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(item, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error('Error getting item:', error);
            throw new Error(`Failed to get item ${args.id} from collection ${args.collection}: ${error.message}`);
        }
    }

    async createItem(args) {
        try {
            const { collection, data } = args;
            
            const item = await this.directus.request(createItem(collection, data));
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(item, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error('Error creating item:', error);
            throw new Error(`Failed to create item in collection ${args.collection}: ${error.message}`);
        }
    }

    async updateItem(args) {
        try {
            const { collection, id, data } = args;
            
            const item = await this.directus.request(updateItem(collection, id, data));
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(item, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error('Error updating item:', error);
            throw new Error(`Failed to update item ${args.id} in collection ${args.collection}: ${error.message}`);
        }
    }

    async deleteItem(args) {
        try {
            const { collection, id } = args;
            
            await this.directus.request(deleteItem(collection, id));
            return {
                content: [
                    {
                        type: 'text',
                        text: `Item ${id} deleted successfully from collection ${collection}`,
                    },
                ],
            };
        } catch (error) {
            console.error('Error deleting item:', error);
            throw new Error(`Failed to delete item ${args.id} from collection ${args.collection}: ${error.message}`);
        }
    }

    async searchItems(args) {
        try {
            const { collection, query, fields, limit = 10 } = args;
            
            const searchFields = fields || ['*'];
            const filter = {
                _or: searchFields.map(field => ({
                    [field]: {
                        _icontains: query,
                    },
                })),
            };

            const items = await this.directus.request(readItems(collection, {
                filter,
                limit,
            }));

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(items, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error('Error searching items:', error);
            throw new Error(`Failed to search items in collection ${args.collection}: ${error.message}`);
        }
    }

    async run() {
        await this.initializeDirectus();
        
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        
        console.error('Directus MCP Server running on stdio');
    }
}

// Run the server
if (require.main === module) {
    const server = new DirectusMCPServer();
    server.run().catch(console.error);
}

module.exports = DirectusMCPServer;
