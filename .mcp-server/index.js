#!/usr/bin/env node

/**
 * MCP Server para DocumentacionProyectos
 * Permite consultar, leer, actualizar y crear documentación
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Ruta base de la documentación
const DOCS_ROOT = process.env.DOCS_ROOT || 'C:\\Users\\desarrollo\\source\\repos\\DocumentacionProyectos';

/**
 * Obtiene todos los archivos markdown recursivamente
 */
async function getAllMarkdownFiles(dir, basePath = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const relativePath = path.join(basePath, entry.name);
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.')) {
            const subFiles = await getAllMarkdownFiles(fullPath, relativePath);
            files.push(...subFiles);
        } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mmd'))) {
            files.push({
                name: entry.name,
                path: relativePath,
                fullPath: fullPath
            });
        }
    }

    return files;
}

/**
 * Busca texto en los archivos de documentación
 */
async function searchDocs(query, project = null) {
    const files = await getAllMarkdownFiles(DOCS_ROOT);
    const results = [];
    const searchRegex = new RegExp(query, 'gi');

    for (const file of files) {
        // Filtrar por proyecto si se especifica
        if (project && !file.path.toLowerCase().startsWith(project.toLowerCase())) {
            continue;
        }

        try {
            const content = await fs.readFile(file.fullPath, 'utf-8');
            const matches = content.match(searchRegex);

            if (matches) {
                // Extraer contexto de las coincidencias
                const lines = content.split('\n');
                const matchedLines = [];

                lines.forEach((line, index) => {
                    if (searchRegex.test(line)) {
                        matchedLines.push({
                            lineNumber: index + 1,
                            content: line.trim().substring(0, 200)
                        });
                    }
                });

                results.push({
                    file: file.path,
                    matchCount: matches.length,
                    matches: matchedLines.slice(0, 5) // Máximo 5 líneas por archivo
                });
            }
        } catch (error) {
            // Ignorar archivos que no se pueden leer
        }
    }

    return results;
}

/**
 * Lee un archivo de documentación
 */
async function readDoc(filePath) {
    const fullPath = path.join(DOCS_ROOT, filePath);

    // Validar que el path está dentro de DOCS_ROOT
    const resolvedPath = path.resolve(fullPath);
    if (!resolvedPath.startsWith(path.resolve(DOCS_ROOT))) {
        throw new Error('Acceso denegado: ruta fuera del directorio de documentación');
    }

    const content = await fs.readFile(resolvedPath, 'utf-8');
    const stats = await fs.stat(resolvedPath);

    return {
        path: filePath,
        content: content,
        size: stats.size,
        modified: stats.mtime.toISOString()
    };
}

/**
 * Actualiza un archivo de documentación
 */
async function updateDoc(filePath, content) {
    const fullPath = path.join(DOCS_ROOT, filePath);

    // Validar que el path está dentro de DOCS_ROOT
    const resolvedPath = path.resolve(fullPath);
    if (!resolvedPath.startsWith(path.resolve(DOCS_ROOT))) {
        throw new Error('Acceso denegado: ruta fuera del directorio de documentación');
    }

    // Verificar que el archivo existe
    await fs.access(resolvedPath);

    // Crear backup
    const backupPath = resolvedPath + '.bak';
    await fs.copyFile(resolvedPath, backupPath);

    // Escribir nuevo contenido
    await fs.writeFile(resolvedPath, content, 'utf-8');

    return {
        path: filePath,
        updated: true,
        backupCreated: true
    };
}

/**
 * Crea un nuevo archivo de documentación
 */
async function createDoc(filePath, content, overwrite = false) {
    const fullPath = path.join(DOCS_ROOT, filePath);

    // Validar que el path está dentro de DOCS_ROOT
    const resolvedPath = path.resolve(fullPath);
    if (!resolvedPath.startsWith(path.resolve(DOCS_ROOT))) {
        throw new Error('Acceso denegado: ruta fuera del directorio de documentación');
    }

    // Verificar si el archivo ya existe
    try {
        await fs.access(resolvedPath);
        if (!overwrite) {
            throw new Error(`El archivo ${filePath} ya existe. Usa overwrite=true para sobrescribir.`);
        }
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }

    // Crear directorio si no existe
    const dir = path.dirname(resolvedPath);
    await fs.mkdir(dir, { recursive: true });

    // Escribir archivo
    await fs.writeFile(resolvedPath, content, 'utf-8');

    return {
        path: filePath,
        created: true
    };
}

/**
 * Lista la estructura de documentación
 */
async function listDocs(project = null) {
    const targetDir = project ? path.join(DOCS_ROOT, project) : DOCS_ROOT;
    const files = await getAllMarkdownFiles(targetDir, project || '');

    // Agrupar por directorio
    const structure = {};

    for (const file of files) {
        const dir = path.dirname(file.path) || 'root';
        if (!structure[dir]) {
            structure[dir] = [];
        }
        structure[dir].push(file.name);
    }

    return {
        totalFiles: files.length,
        structure: structure
    };
}

// Crear servidor MCP
const server = new Server(
    {
        name: 'mcp-docs-trajano',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
            resources: {},
        },
    }
);

// Definir herramientas
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'search_docs',
                description: 'Busca texto en la documentación de proyectos Trajano (ICARUS, IMCA, IMGA, ARGOS)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'Texto a buscar (soporta expresiones regulares)'
                        },
                        project: {
                            type: 'string',
                            description: 'Filtrar por proyecto: ICARUS, IMCA, IMGA o ARGOS (opcional)',
                            enum: ['ICARUS', 'IMCA', 'IMGA', 'ARGOS']
                        }
                    },
                    required: ['query']
                }
            },
            {
                name: 'read_doc',
                description: 'Lee el contenido completo de un archivo de documentación',
                inputSchema: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'Ruta relativa del archivo, ej: ICARUS/README.md'
                        }
                    },
                    required: ['path']
                }
            },
            {
                name: 'update_doc',
                description: 'Actualiza el contenido de un archivo de documentación existente (crea backup)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'Ruta relativa del archivo a actualizar'
                        },
                        content: {
                            type: 'string',
                            description: 'Nuevo contenido del archivo'
                        }
                    },
                    required: ['path', 'content']
                }
            },
            {
                name: 'create_doc',
                description: 'Crea un nuevo archivo de documentación',
                inputSchema: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'Ruta relativa del nuevo archivo, ej: ICARUS/modulos/nuevo-modulo.md'
                        },
                        content: {
                            type: 'string',
                            description: 'Contenido del nuevo archivo'
                        },
                        overwrite: {
                            type: 'boolean',
                            description: 'Sobrescribir si ya existe (default: false)'
                        }
                    },
                    required: ['path', 'content']
                }
            },
            {
                name: 'list_docs',
                description: 'Lista todos los archivos de documentación con su estructura',
                inputSchema: {
                    type: 'object',
                    properties: {
                        project: {
                            type: 'string',
                            description: 'Filtrar por proyecto: ICARUS, IMCA, IMGA o ARGOS (opcional)',
                            enum: ['ICARUS', 'IMCA', 'IMGA', 'ARGOS']
                        }
                    }
                }
            }
        ]
    };
});

// Manejar llamadas a herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        let result;

        switch (name) {
            case 'search_docs':
                result = await searchDocs(args.query, args.project);
                break;
            case 'read_doc':
                result = await readDoc(args.path);
                break;
            case 'update_doc':
                result = await updateDoc(args.path, args.content);
                break;
            case 'create_doc':
                result = await createDoc(args.path, args.content, args.overwrite || false);
                break;
            case 'list_docs':
                result = await listDocs(args.project);
                break;
            default:
                throw new Error(`Herramienta desconocida: ${name}`);
        }

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error.message}`
                }
            ],
            isError: true
        };
    }
});

// Definir recursos (archivos de documentación como recursos)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const files = await getAllMarkdownFiles(DOCS_ROOT);

    return {
        resources: files.map(file => ({
            uri: `docs://${file.path.replace(/\\/g, '/')}`,
            name: file.name,
            description: `Documentación: ${file.path}`,
            mimeType: 'text/markdown'
        }))
    };
});

// Leer recursos
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const filePath = uri.replace('docs://', '');

    const doc = await readDoc(filePath);

    return {
        contents: [
            {
                uri: uri,
                mimeType: 'text/markdown',
                text: doc.content
            }
        ]
    };
});

// Iniciar servidor
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP Docs Trajano server running on stdio');
}

main().catch(console.error);
