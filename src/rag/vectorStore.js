/**
 * Vector Storage Module using FAISS
 * 
 * Provides utilities for storing and retrieving code embeddings using FAISS.
 * This module is responsible for the vector search component (70%) of the
 * hybrid retrieval system.
 */

import fs from 'fs';
import path from 'path';
import { getEmbeddingDimension } from './embeddings.js';

// FAISS module will be loaded dynamically
let faiss = null;

// Configuration
const EMBEDDING_DIMENSION = getEmbeddingDimension(); // 768 for CodeBERT

/**
 * Initialize FAISS if not already loaded
 * @returns {Promise<void>}
 */
async function ensureFaissLoaded() {
  if (!faiss) {
    try {
      // Import the entire faiss-node module
      faiss = await import('faiss-node');
    } catch (error) {
      throw new Error(`Failed to load FAISS. Please ensure faiss-node is installed: npm install faiss-node`);
    }
  }
}

/**
 * Create a new FAISS index for code embeddings
 * @param {Object} options - Index options
 * @returns {Promise<Object>} The created index
 */
export async function createFAISSIndex(options = {}) {
  await ensureFaissLoaded();
  
  const {
    dimension = EMBEDDING_DIMENSION
  } = options;
  
  let index = null;
  let lastError = null;
  
  // Try multiple approaches to create the index
  const approaches = [
    () => new faiss.IndexFlatL2(dimension),
    () => faiss.default ? new faiss.default.IndexFlatL2(dimension) : null,
    () => new faiss.default.IndexFlatL2(dimension),
    () => faiss.IndexFlatL2 ? faiss.IndexFlatL2(dimension) : null,
    () => faiss.default && faiss.default.IndexFlatL2 ? faiss.default.IndexFlatL2(dimension) : null
  ];
  
  for (let i = 0; i < approaches.length; i++) {
    try {
      const result = approaches[i]();
      if (result) {
        index = result;
        break;
      }
    } catch (error) {
      lastError = error;
    }
  }
  
  if (!index) {
    throw new Error(`Failed to create FAISS index. Please check faiss-node installation. Last error: ${lastError?.message || 'Unknown error'}`);
  }
  
  return {
    index,
    dimension,
    size: 0,
    idToMetadata: new Map() // Map to store metadata for each vector
  };
}

/**
 * Add embeddings to the FAISS index
 * @param {Object} indexWrapper - The index wrapper object
 * @param {Array<Object>} chunks - Chunks with embeddings to add
 * @returns {Promise<Object>} Updated index wrapper
 */
export async function addToIndex(indexWrapper, chunks) {
  const { index, idToMetadata } = indexWrapper;
  
  try {
    // Validate input first
    if (!Array.isArray(chunks)) {
      console.error('Chunks must be an array, got:', typeof chunks);
      throw new Error('Invalid the first argument type, must be an Array');
    }
    
    // Validate input first
    
    // Extract and validate embeddings from chunks
    const embeddings = [];
    const validChunks = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = chunk.embedding;
      
      // Skip chunks without embeddings
      if (!embedding) {
        console.warn(`Chunk ${i} has no embedding, skipping`);
        continue;
      }
      
      let processedEmbedding;
      
      // Handle different input types and ensure Float32Array
      if (embedding instanceof Float32Array) {
        // Already correct type - validate dimension
        if (embedding.length !== 768) { // CodeBERT dimension
          console.warn(`Embedding ${i} has wrong dimension: ${embedding.length}, expected 768`);
          // Create correctly sized embedding
          processedEmbedding = new Float32Array(768);
          const copyLength = Math.min(embedding.length, 768);
          processedEmbedding.set(embedding.subarray(0, copyLength));
          if (copyLength < 768) {
            processedEmbedding.fill(0, copyLength); // Fill remaining with zeros
          }
        } else {
          processedEmbedding = embedding;
        }
      } else if (Array.isArray(embedding)) {
        // Convert array to Float32Array
        const numericArray = embedding.filter(x => typeof x === 'number' && !isNaN(x));
        if (numericArray.length === 0) {
          console.warn(`Chunk ${i} has no valid numeric values in embedding, skipping`);
          continue;
        }
        
        // Ensure correct dimension
        if (numericArray.length !== 768) {
          console.warn(`Array embedding ${i} has wrong dimension: ${numericArray.length}, expected 768`);
          if (numericArray.length < 768) {
            numericArray.push(...new Array(768 - numericArray.length).fill(0));
          } else {
            numericArray.splice(768);
          }
        }
        
        processedEmbedding = new Float32Array(numericArray);
      } else if (embedding && typeof embedding === 'object' && embedding.values instanceof Float32Array) {
        // Handle transformers.js format
        processedEmbedding = embedding.values;
      } else {
        console.error(`Chunk ${i} has invalid embedding format:`, typeof embedding);
        console.error('Embedding value:', embedding);
        continue; // Skip this chunk
      }
      
      // Final validation
      if (!(processedEmbedding instanceof Float32Array) || processedEmbedding.length !== 768) {
        console.error(`Failed to process embedding ${i} correctly`);
        continue;
      }
      
      // Check for NaN or infinite values
      const hasInvalidValues = Array.from(processedEmbedding).some(x => !isFinite(x));
      if (hasInvalidValues) {
        console.warn(`Embedding ${i} contains NaN or infinite values, replacing with zeros`);
        processedEmbedding = new Float32Array(768).fill(0.1);
      }
      
      embeddings.push(processedEmbedding);
      validChunks.push(chunk);
    }
    
    if (embeddings.length === 0) {
      console.warn('No valid embeddings to add to index');
      return indexWrapper;
    }
    

    
    // Get the current size of the index
    const startId = indexWrapper.size;
    
    // Add embeddings to the index one by one with better error handling
    for (let i = 0; i < embeddings.length; i++) {
      try {
        // Convert Float32Array to regular array for FAISS compatibility
        const embeddingArray = Array.from(embeddings[i]);
        index.add(embeddingArray);
      } catch (addError) {
        console.error(`Error adding embedding ${i} to FAISS index:`, addError.message);
        console.error('Embedding details:', {
          type: typeof embeddings[i],
          isFloat32Array: embeddings[i] instanceof Float32Array,
          length: embeddings[i].length,
          firstValues: Array.from(embeddings[i].slice(0, 3)),
          convertedType: typeof Array.from(embeddings[i]),
          convertedLength: Array.from(embeddings[i]).length
        });
        throw new Error(`Failed to add embedding ${i} to FAISS index: ${addError.message}`);
      }
    }
    
    // Update the size
    indexWrapper.size += embeddings.length;
    
    // Store metadata for each embedding
    validChunks.forEach((chunk, i) => {
      const id = startId + i;
      
      // Store metadata without the embedding to save memory
      const { embedding, ...metadata } = chunk;
      idToMetadata.set(id, metadata);
    });
    

    
    return indexWrapper;
  } catch (error) {
    console.error('Error in addToIndex:', error);
    throw new Error(`Failed to add embeddings to index: ${error.message}`);
  }
}

/**
 * Search the FAISS index for similar embeddings
 * @param {Object} indexWrapper - The index wrapper object
 * @param {Float32Array} queryEmbedding - The query embedding
 * @param {number} k - Number of results to return
 * @returns {Promise<Array<Object>>} Search results with metadata
 */
export async function searchIndex(indexWrapper, queryEmbedding, k = 5) {
  const { index, idToMetadata } = indexWrapper;
  
  try {
    // Safety check: ensure k doesn't exceed the total number of vectors
    const totalVectors = indexWrapper.size || 0;
    const safeK = Math.min(k, totalVectors);
    
    if (safeK === 0) {
      console.warn('Vector index is empty, returning empty results');
      return [];
    }
    
    if (safeK < k) {
      // Adjusted search k to match available vectors
    }
    
    // Convert query embedding to regular array for FAISS compatibility
    let queryArray;
    if (queryEmbedding instanceof Float32Array) {
      queryArray = Array.from(queryEmbedding);
    } else if (Array.isArray(queryEmbedding)) {
      queryArray = queryEmbedding;
    } else {
      queryArray = Array.from(new Float32Array(queryEmbedding));
    }
    
    // Search the index with safe k value
    const result = index.search(queryArray, safeK);
    
    // Extract distances and indices from result
    // The structure might vary depending on faiss-node version
    let distances, labels;
    
    if (result.distances && result.labels) {
      distances = result.distances;
      labels = result.labels;
    } else if (Array.isArray(result) && result.length === 2) {
      [distances, labels] = result;
    } else {
      // Fallback: assume result is in a different format
      distances = result.distance || result.scores || [];
      labels = result.indices || result.ids || [];
    }
    
    // Map results to metadata
    const searchResults = [];
    const numResults = Math.min(labels.length, distances.length);
    
    for (let i = 0; i < numResults; i++) {
      const id = labels[i];
      
      // Skip invalid IDs (can happen if index is not fully populated)
      if (id === -1 || id === undefined || id === null) continue;
      
      const metadata = idToMetadata.get(id);
      
      // Skip if metadata not found
      if (!metadata) continue;
      
      // Convert distance to similarity score
      // For L2 distance, smaller is better, so we invert it
      const distance = distances[i];
      const score = Math.max(0, 1 - distance / 100); // Normalize distance to similarity
      
      searchResults.push({
        id,
        score,
        distance,
        metadata
      });
    }
    
    // Sort by score (highest first)
    searchResults.sort((a, b) => b.score - a.score);
    
    return searchResults;
  } catch (error) {
    throw new Error(`Failed to search index: ${error.message}`);
  }
}

/**
 * Save the FAISS index to disk
 * @param {Object} indexWrapper - The index wrapper object
 * @param {string} directory - Directory to save the index
 * @param {string} name - Name of the index
 * @returns {Promise<string>} Path to the saved index
 */
export async function saveIndex(indexWrapper, directory, name = 'code_index') {
  const { index, dimension, size, idToMetadata } = indexWrapper;
  
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    
    // Save the index
    const indexPath = path.join(directory, `${name}.faiss`);
    
    // Try multiple approaches to save the index
    let saved = false;
    let lastError = null;
    
    const saveApproaches = [
      () => index.writeIndex ? index.writeIndex(indexPath) : null,
      () => index.write ? index.write(indexPath) : null,
      () => faiss.writeIndex ? faiss.writeIndex(index, indexPath) : null,
      () => faiss.default && faiss.default.writeIndex ? faiss.default.writeIndex(index, indexPath) : null
    ];
    
    for (let i = 0; i < saveApproaches.length; i++) {
      try {
        const result = saveApproaches[i]();
        // Check if the file actually exists after the save attempt, regardless of return value
        // Many FAISS write operations return null/undefined even on success
        if (fs.existsSync(indexPath)) {
          saved = true;
          break;
        }
      } catch (error) {
        lastError = error;
        // Continue to next approach if this one failed
      }
    }
    
    // Only warn if the file genuinely doesn't exist after all attempts
    if (!saved && !fs.existsSync(indexPath)) {
      console.warn(`Could not save index to ${indexPath}. Index will only exist in memory.`);
      // Don't throw an error, just warn - the index can still be used in memory
    }
    
    // Save metadata
    const metadataPath = path.join(directory, `${name}.metadata.json`);
    const metadataObj = {
      dimension,
      size,
      metadata: Array.from(idToMetadata.entries())
    };
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadataObj, null, 2));
    
    return indexPath;
  } catch (error) {
    throw new Error(`Failed to save index: ${error.message}`);
  }
}

/**
 * Load a FAISS index from disk
 * @param {string} directory - Directory where the index is saved
 * @param {string} name - Name of the index
 * @returns {Promise<Object>} Loaded index wrapper
 */
export async function loadIndex(directory, name = 'code_index') {
  await ensureFaissLoaded();
  
  try {
    // Check if index exists
    const indexPath = path.join(directory, `${name}.faiss`);
    const metadataPath = path.join(directory, `${name}.metadata.json`);
    
    if (!fs.existsSync(indexPath) || !fs.existsSync(metadataPath)) {
      throw new Error(`Index or metadata file not found at ${directory}`);
    }
    
    // Load metadata
    const metadataStr = fs.readFileSync(metadataPath, 'utf-8');
    const metadataObj = JSON.parse(metadataStr);
    
    // Try multiple approaches to load the index
    let index = null;
    let lastError = null;
    
    const loadApproaches = [
      () => faiss.readIndex ? faiss.readIndex(indexPath) : null,
      () => faiss.IndexFlatL2 && faiss.IndexFlatL2.readIndex ? faiss.IndexFlatL2.readIndex(indexPath) : null,
      () => faiss.IndexFlatL2 && faiss.IndexFlatL2.read ? faiss.IndexFlatL2.read(indexPath) : null,
      () => faiss.default && faiss.default.readIndex ? faiss.default.readIndex(indexPath) : null,
      () => faiss.default && faiss.default.IndexFlatL2 && faiss.default.IndexFlatL2.readIndex ? faiss.default.IndexFlatL2.readIndex(indexPath) : null,
      () => faiss.default && faiss.default.IndexFlatL2 && faiss.default.IndexFlatL2.read ? faiss.default.IndexFlatL2.read(indexPath) : null,
    ];
    
    for (let i = 0; i < loadApproaches.length; i++) {
      try {
        const result = loadApproaches[i]();
        if (result) {
          index = result;
          break;
        }
      } catch (error) {
        lastError = error;
      }
    }
    
    if (!index) {
      // If all loading methods fail, create a new index and warn the user
      console.warn(`Could not load existing index from ${indexPath}. Creating new index instead.`);
      
      // Create a new index with the same dimension
      const newIndexWrapper = await createFAISSIndex({ dimension: metadataObj.dimension });
      
      // Return the new index but keep the metadata for reference
      return {
        ...newIndexWrapper,
        size: 0, // Reset size since we're starting fresh
        idToMetadata: new Map() // Reset metadata
      };
    }
    
    // Reconstruct metadata map
    const idToMetadata = new Map(metadataObj.metadata);
    
    return {
      index,
      dimension: metadataObj.dimension,
      size: metadataObj.size,
      idToMetadata
    };
  } catch (error) {
    throw new Error(`Failed to load index: ${error.message}`);
  }
}

/**
 * Check if an index exists
 * @param {string} directory - Directory to check
 * @param {string} name - Name of the index
 * @returns {boolean} Whether the index exists
 */
export function indexExists(directory, name = 'code_index') {
  const indexPath = path.join(directory, `${name}.faiss`);
  const metadataPath = path.join(directory, `${name}.metadata.json`);
  
  return fs.existsSync(indexPath) && fs.existsSync(metadataPath);
}

/**
 * Get index statistics
 * @param {Object} indexWrapper - The index wrapper object
 * @returns {Object} Index statistics
 */
export function getIndexStats(indexWrapper) {
  const { dimension, size, idToMetadata } = indexWrapper;
  
  // Count files
  const filePaths = new Set();
  for (const metadata of idToMetadata.values()) {
    if (metadata.filePath) {
      filePaths.add(metadata.filePath);
    }
  }
  
  return {
    vectorCount: size,
    dimension,
    fileCount: filePaths.size,
    memoryUsage: estimateMemoryUsage(indexWrapper)
  };
}

/**
 * Estimate memory usage of the index
 * @param {Object} indexWrapper - The index wrapper object
 * @returns {number} Estimated memory usage in bytes
 */
function estimateMemoryUsage(indexWrapper) {
  const { dimension, size } = indexWrapper;
  
  // Estimate FAISS index memory
  // IndexFlatL2 stores vectors as float32 (4 bytes per dimension)
  const vectorMemory = size * dimension * 4;
  
  // Estimate metadata memory (rough approximation)
  const metadataMemory = size * 200; // Assume average 200 bytes per metadata entry
  
  return vectorMemory + metadataMemory;
}

/**
 * Create a new index or load existing
 * @param {string} directory - Directory for the index
 * @param {string} name - Name of the index
 * @param {Object} options - Index options
 * @returns {Promise<Object>} Index wrapper
 */
export async function getOrCreateIndex(directory, name = 'code_index', options = {}) {
  try {
    if (indexExists(directory, name)) {
      return await loadIndex(directory, name);
    } else {
      return await createFAISSIndex(options);
    }
  } catch (error) {
    throw new Error(`Failed to get or create index: ${error.message}`);
  }
}