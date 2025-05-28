/**
 * RAG (Retrieval-Augmented Generation) System
 * 
 * Main entry point for the RAG system that retrieves relevant code files
 * for error analysis. This system uses CodeBERT for embeddings, FAISS for
 * vector storage, and a hybrid BM25 + vector search approach for retrieval.
 */

import fs from 'fs';
import path from 'path';
import { processFile, batchProcessFiles, isFileSupported, getEmbeddingDimension, generateEmbedding } from './embeddings.js';
import { chunkCodeFile, determineOptimalChunkSize } from './chunking.js';
import { 
  createFAISSIndex, 
  addToIndex, 
  searchIndex, 
  saveIndex, 
  loadIndex, 
  indexExists, 
  getIndexStats,
  getOrCreateIndex
} from './vectorStore.js';
import {
  createBM25Index,
  preprocessCodeForBM25,
  bm25IndexExists,
  getOrCreateBM25Index
} from './bm25.js';
import {
  hybridSearch,
  prepareQueryForSearch,
  identifyRootCauseFile,
  groupResultsByFile
} from './hybridSearch.js';

// Configuration
const DEFAULT_TOP_K = 5; // Default number of results to return
const VECTOR_INDEX_NAME = 'code_vectors';
const BM25_INDEX_NAME = 'code_bm25';
const DEFAULT_BM25_WEIGHT = 0.3;
const DEFAULT_VECTOR_WEIGHT = 0.7;

/**
 * Get RAG data directory for a specific project root
 * @param {string} projectRoot - Project root directory
 * @returns {string} RAG data directory path
 */
function getRAGDataDir(projectRoot) {
  return path.join(projectRoot, '.cloi', 'rag-data');
}

/**
 * Initialize the RAG system for a specific project
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object>} The initialized system components
 */
export async function initializeRAG(projectRoot) {
  // Get RAG data directory for this project
  const ragDataDir = getRAGDataDir(projectRoot);
  
  // Ensure the necessary directories exist
  if (!fs.existsSync(ragDataDir)) {
    fs.mkdirSync(ragDataDir, { recursive: true });
  }
  
  // Initialize or load the vector index
  const vectorIndex = await getOrCreateIndex(ragDataDir, VECTOR_INDEX_NAME);
  
  // Initialize or load the BM25 index
  const bm25Index = getOrCreateBM25Index(ragDataDir, BM25_INDEX_NAME);
  
  if (vectorIndex.size > 0) {
    const stats = getIndexStats(vectorIndex);
  }
  
  if (bm25Index.documentCount > 0) {
    const stats = bm25Index.getStats();
  }
  
  return {
    vectorIndex,
    bm25Index,
    ragDataDir
  };
}

/**
 * Index a codebase for RAG retrieval
 * @param {string} projectPath - Path to the project root
 * @param {Object} options - Indexing options
 * @returns {Promise<Object>} Indexing results
 */
export async function indexCodebase(projectPath, options = {}) {
  const {
    excludeDirs = ['node_modules', '.git', '__pycache__', 'venv', '.env'],
    maxFilesToProcess = 1000,
    batchSize = 20,
    forceReindex = false
  } = options;
  
  // Initialize the RAG system
  const { vectorIndex, bm25Index, ragDataDir } = await initializeRAG(projectPath);
  
  // Find all code files in the project
  const codeFiles = await findCodeFiles(projectPath, excludeDirs);
  
  // Limit the number of files to process if needed
  const filesToProcess = codeFiles.slice(0, maxFilesToProcess);
  
  // Process files in batches
  let totalChunks = 0;
  let totalFiles = 0;
  
  for (let i = 0; i < filesToProcess.length; i += batchSize) {
    const batch = filesToProcess.slice(i, i + batchSize);
    
    // Process each file in the batch
    const allChunks = [];
    const bm25Documents = [];
    
    for (const filePath of batch) {
      try {
        // Process file for vector embeddings
        const fileResult = await processFile(filePath);
        
        if (fileResult && fileResult.length > 0) {
          // Add to vector chunks
          allChunks.push(...fileResult);
          
          // Add to BM25 documents
          for (const chunk of fileResult) {
            const preprocessedContent = preprocessCodeForBM25(chunk.content);
            
            bm25Documents.push({
              id: `${filePath}:${chunk.startLine}-${chunk.endLine}`,
              content: preprocessedContent,
              metadata: {
                filePath: chunk.filePath,
                fileName: path.basename(chunk.filePath),
                startLine: chunk.startLine,
                endLine: chunk.endLine,
                fileExt: path.extname(chunk.filePath).toLowerCase(),
                hasImports: chunk.metadata?.hasImports || false
              }
            });
          }
          
          totalFiles++;
        }
      } catch (error) {
        // Continue with other files silently
      }
    }
    
    // Add chunks to the vector index
    if (allChunks.length > 0) {
      await addToIndex(vectorIndex, allChunks);
      totalChunks += allChunks.length;
    }
    
    // Add documents to the BM25 index
    if (bm25Documents.length > 0) {
      bm25Index.addDocuments(bm25Documents);
    }
  }
  
  // Save the updated indices
  await saveIndex(vectorIndex, ragDataDir, VECTOR_INDEX_NAME);
  bm25Index.save(ragDataDir, BM25_INDEX_NAME);
  
  const vectorStats = getIndexStats(vectorIndex);
  const bm25Stats = bm25Index.getStats();
  
  // Return the results
  return {
    projectPath,
    vectorIndex,
    bm25Index,
    fileCount: totalFiles,
    chunkCount: totalChunks,
    vectorStats,
    bm25Stats
  };
}

/**
 * Find all code files in a project
 * @param {string} projectPath - Path to the project root
 * @param {Array<string>} excludeDirs - Directories to exclude
 * @returns {Promise<Array<string>>} Array of file paths
 */
async function findCodeFiles(projectPath, excludeDirs) {
  const codeFiles = [];
  
  // Enhanced exclusion list with system directories
  const defaultExcludes = [
    'node_modules', '.git', '__pycache__', 'venv', '.env',
    '.Trash', '.npm', '.cache', '.tmp', 'tmp', 'temp',
    '.DS_Store', 'Thumbs.db', '.vscode', '.idea',
    'build', 'dist', 'out', 'target',
    '.next', '.nuxt', '.svelte-kit',
    'coverage', '.nyc_output', '.pytest_cache',
    '.tox', '.eggs', 'egg-info'
  ];
  
  const allExcludes = [...new Set([...defaultExcludes, ...excludeDirs])];
  
  // Recursive function to walk directory
  async function walkDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // Skip excluded directories and hidden directories that start with dot
        if (entry.isDirectory()) {
          // Skip if directory name is in exclude list
          if (allExcludes.includes(entry.name)) {
            continue;
          }
          
          // Skip hidden directories (except .cloi for our own data)
          if (entry.name.startsWith('.') && entry.name !== '.cloi') {
            continue;
          }
          
          // Safety check: don't go outside project boundaries
          if (!fullPath.startsWith(projectPath)) {
            continue;
          }
          
          try {
            await walkDir(fullPath);
          } catch (error) {
            // Continue silently with other directories
          }
          continue;
        }
        
        // Check if file is supported
        if (entry.isFile() && isFileSupported(fullPath)) {
          codeFiles.push(fullPath);
        }
      }
    } catch (error) {
      // Handle permission errors gracefully and silently
    }
  }
  
  await walkDir(projectPath);
  return codeFiles;
}

/**
 * Search for relevant code files using vector similarity
 * @param {string} query - The query text
 * @param {Object} vectorIndex - The FAISS index wrapper
 * @param {number} k - Number of results to return
 * @returns {Promise<Array<Object>>} Search results
 */
export async function searchVectorIndex(query, vectorIndex, k = DEFAULT_TOP_K) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Search the index
    const results = await searchIndex(vectorIndex, queryEmbedding, k);
    
    return results;
  } catch (error) {
    console.error('Error searching vector index:', error);
    throw new Error(`Failed to search vector index: ${error.message}`);
  }
}

/**
 * Search for relevant code files using BM25
 * @param {string} query - The query text
 * @param {Object} bm25Index - The BM25 index
 * @param {number} k - Number of results to return
 * @returns {Array<Object>} Search results
 */
export function searchBM25Index(query, bm25Index, k = DEFAULT_TOP_K) {
  try {
    // Prepare query for BM25
    const processedQuery = prepareQueryForSearch(query);
    
    // Search the index
    const results = bm25Index.search(processedQuery, k);
    
    return results;
  } catch (error) {
    console.error('Error searching BM25 index:', error);
    throw new Error(`Failed to search BM25 index: ${error.message}`);
  }
}

/**
 * Retrieve relevant code files for an error log using hybrid search
 * @param {string} errorLog - The error log content
 * @param {string} projectRoot - Project root directory
 * @param {Object} options - Search options
 * @returns {Promise<Array<Object>>} Relevant code files
 */
export async function retrieveRelevantFiles(errorLog, projectRoot, options = {}) {
  const {
    k = DEFAULT_TOP_K,
    bm25Weight = DEFAULT_BM25_WEIGHT,
    vectorWeight = DEFAULT_VECTOR_WEIGHT,
    identifyRoot = true
  } = options;
  
  try {
    // Initialize the RAG system
    let { vectorIndex, bm25Index } = await initializeRAG(projectRoot);
    
    // Check if indices are empty and auto-index if needed
    if (vectorIndex.size === 0 || bm25Index.documentCount === 0) {
      console.log('  Codebase not indexed yet, building search index...');
      
      try {
        // Auto-index the codebase with reasonable limits
        const indexResults = await indexCodebase(projectRoot, {
          maxFilesToProcess: 100, // Limit for automatic indexing
          batchSize: 10
        });
        
        // Use the newly created indices
        vectorIndex = indexResults.vectorIndex;
        bm25Index = indexResults.bm25Index;
        
        // Final check - if still empty, return empty results
        if (vectorIndex.size === 0) {
          console.log('  No code files found to index in this project');
          return {
            results: [],
            groupedResults: [],
            rootCauseFile: null
          };
        }
        
      } catch (indexError) {
        console.log(`  Auto-indexing failed: ${indexError.message}`);
        // Return empty results instead of throwing error
        return {
          results: [],
          groupedResults: [],
          rootCauseFile: null
        };
      }
    }
    
    // Adjust k based on available data to prevent FAISS errors
    const maxAvailable = Math.max(vectorIndex.size, bm25Index.documentCount);
    const safeK = Math.min(k, maxAvailable);
    
    // Prepare the query
    const processedQuery = prepareQueryForSearch(errorLog);
    
    // Perform hybrid search with safe k value
    const results = await hybridSearch(processedQuery, vectorIndex, bm25Index, {
      bm25Weight,
      vectorWeight,
      k: safeK
    });
    
    // Group results by file for better organization
    const groupedResults = groupResultsByFile(results);
    
    // Identify the root cause file if requested
    let rootCauseFile = null;
    if (identifyRoot && results.length > 0) {
      rootCauseFile = identifyRootCauseFile(results, errorLog);
    }
    
    return {
      results,
      groupedResults,
      rootCauseFile
    };
  } catch (error) {
    console.error('Error retrieving relevant files:', error);
    throw new Error(`Failed to retrieve relevant files: ${error.message}`);
  }
}

/**
 * Generate embeddings for a single file and add to index
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} Processing results
 */
export async function indexSingleFile(filePath) {
  try {
    if (!isFileSupported(filePath)) {
      throw new Error(`File type not supported: ${filePath}`);
    }
    
    // Get project root from file path
    const projectRoot = path.dirname(filePath);
    
    // Initialize the RAG system
    const { vectorIndex, bm25Index, ragDataDir } = await initializeRAG(projectRoot);
    
    // Process the file
    const chunks = await processFile(filePath);
    
    // Add to indices
    if (chunks.length > 0) {
      // Add to vector index
      await addToIndex(vectorIndex, chunks);
      
      // Add to BM25 index
      const bm25Documents = chunks.map(chunk => ({
        id: `${filePath}:${chunk.startLine}-${chunk.endLine}`,
        content: preprocessCodeForBM25(chunk.content),
        metadata: {
          filePath: chunk.filePath,
          fileName: path.basename(chunk.filePath),
          startLine: chunk.startLine,
          endLine: chunk.endLine,
          fileExt: path.extname(chunk.filePath).toLowerCase(),
          hasImports: chunk.metadata?.hasImports || false
        }
      }));
      
      bm25Index.addDocuments(bm25Documents);
      
      // Save the updated indices
      await saveIndex(vectorIndex, ragDataDir, VECTOR_INDEX_NAME);
      bm25Index.save(ragDataDir, BM25_INDEX_NAME);
    }
    
    return {
      filePath,
      chunkCount: chunks.length,
      vectorStats: getIndexStats(vectorIndex),
      bm25Stats: bm25Index.getStats()
    };
  } catch (error) {
    console.error(`Error indexing file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Get statistics about the current RAG indices
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object>} Index statistics
 */
export async function getRAGStats(projectRoot) {
  try {
    // Initialize the RAG system
    const { vectorIndex, bm25Index } = await initializeRAG(projectRoot);
    
    return {
      vectorStats: getIndexStats(vectorIndex),
      bm25Stats: bm25Index.getStats(),
      hybridConfig: {
        bm25Weight: DEFAULT_BM25_WEIGHT,
        vectorWeight: DEFAULT_VECTOR_WEIGHT
      }
    };
  } catch (error) {
    console.error('Error getting RAG stats:', error);
    throw new Error(`Failed to get RAG stats: ${error.message}`);
  }
}
