/**
 * State Manager - Session and Fix State Tracking
 * 
 * Manages application state including session data, fix history,
 * and rollback capabilities. Inspired by Terraform's state management.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';

/**
 * State Types
 */
export const STATE_TYPES = {
  SESSION: 'session',
  FIX: 'fix',
  ANALYSIS: 'analysis',
  PLUGIN: 'plugin'
};

/**
 * Fix Status
 */
export const FIX_STATUS = {
  PENDING: 'pending',
  APPLIED: 'applied',
  FAILED: 'failed',
  ROLLED_BACK: 'rolled_back'
};

/**
 * State Manager Class
 */
export class StateManager {
  constructor(options = {}) {
    this.options = options;
    this.stateDir = this.getStateDirectory();
    this.sessionId = this.generateSessionId();
    this.currentSession = null;
    this.fixHistory = [];
    this.locks = new Map();
    
    this.ensureStateDirectory();
  }

  /**
   * Get state directory path
   */
  getStateDirectory() {
    const defaultPath = path.join(process.cwd(), '.cloi', 'state');
    return this.options.stateDir || defaultPath;
  }

  /**
   * Ensure state directory exists
   */
  ensureStateDirectory() {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true });
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `${timestamp}-${random}`;
  }

  /**
   * Start a new session
   */
  async startSession(context = {}) {
    const session = {
      id: this.sessionId,
      startTime: new Date().toISOString(),
      endTime: null,
      context: {
        workingDirectory: process.cwd(),
        user: process.env.USER || process.env.USERNAME,
        ...context
      },
      fixes: [],
      analyses: [],
      status: 'active'
    };

    this.currentSession = session;
    await this.saveState(STATE_TYPES.SESSION, session.id, session);
    
    console.log(chalk.gray(`📝 Started session: ${session.id}`));
    return session;
  }

  /**
   * End current session
   */
  async endSession() {
    if (!this.currentSession) {
      throw new Error('No active session to end');
    }

    this.currentSession.endTime = new Date().toISOString();
    this.currentSession.status = 'completed';
    
    await this.saveState(STATE_TYPES.SESSION, this.currentSession.id, this.currentSession);
    
    console.log(chalk.gray(`✅ Ended session: ${this.currentSession.id}`));
    
    const sessionSummary = {
      id: this.currentSession.id,
      duration: this.getSessionDuration(),
      fixesApplied: this.currentSession.fixes.filter(f => f.status === FIX_STATUS.APPLIED).length,
      analysesPerformed: this.currentSession.analyses.length
    };

    this.currentSession = null;
    return sessionSummary;
  }

  /**
   * Record an analysis in the current session
   */
  async recordAnalysis(analysis) {
    if (!this.currentSession) {
      await this.startSession();
    }

    const analysisRecord = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      sessionId: this.currentSession.id,
      ...analysis
    };

    this.currentSession.analyses.push(analysisRecord);
    await this.saveState(STATE_TYPES.SESSION, this.currentSession.id, this.currentSession);
    await this.saveState(STATE_TYPES.ANALYSIS, analysisRecord.id, analysisRecord);

    return analysisRecord;
  }

  /**
   * Record a fix attempt
   */
  async recordFix(fix) {
    if (!this.currentSession) {
      await this.startSession();
    }

    const fixRecord = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      sessionId: this.currentSession.id,
      status: FIX_STATUS.PENDING,
      rollbackData: null,
      ...fix
    };

    this.currentSession.fixes.push(fixRecord);
    this.fixHistory.push(fixRecord);
    
    await this.saveState(STATE_TYPES.SESSION, this.currentSession.id, this.currentSession);
    await this.saveState(STATE_TYPES.FIX, fixRecord.id, fixRecord);

    return fixRecord;
  }

  /**
   * Update fix status
   */
  async updateFixStatus(fixId, status, additionalData = {}) {
    const fix = this.findFix(fixId);
    if (!fix) {
      throw new Error(`Fix not found: ${fixId}`);
    }

    fix.status = status;
    fix.updatedAt = new Date().toISOString();
    Object.assign(fix, additionalData);

    // Update in session
    const sessionFix = this.currentSession?.fixes.find(f => f.id === fixId);
    if (sessionFix) {
      Object.assign(sessionFix, fix);
      await this.saveState(STATE_TYPES.SESSION, this.currentSession.id, this.currentSession);
    }

    await this.saveState(STATE_TYPES.FIX, fixId, fix);
    return fix;
  }

  /**
   * Prepare rollback data for a fix
   */
  async prepareRollback(fixId, rollbackData) {
    const fix = this.findFix(fixId);
    if (!fix) {
      throw new Error(`Fix not found: ${fixId}`);
    }

    fix.rollbackData = {
      timestamp: new Date().toISOString(),
      ...rollbackData
    };

    await this.saveState(STATE_TYPES.FIX, fixId, fix);
    return fix;
  }

  /**
   * Rollback a fix
   */
  async rollbackFix(fixId) {
    const fix = this.findFix(fixId);
    if (!fix) {
      throw new Error(`Fix not found: ${fixId}`);
    }

    if (!fix.rollbackData) {
      throw new Error(`No rollback data available for fix: ${fixId}`);
    }

    if (fix.status === FIX_STATUS.ROLLED_BACK) {
      throw new Error(`Fix already rolled back: ${fixId}`);
    }

    // Perform rollback using stored data
    const rollbackResult = await this.performRollback(fix);
    
    await this.updateFixStatus(fixId, FIX_STATUS.ROLLED_BACK, {
      rollbackResult,
      rolledBackAt: new Date().toISOString()
    });

    return rollbackResult;
  }

  /**
   * Perform the actual rollback
   */
  async performRollback(fix) {
    const { rollbackData } = fix;
    
    switch (fix.type) {
      case 'file':
        return await this.rollbackFileChanges(rollbackData);
      case 'command':
        return await this.rollbackCommand(rollbackData);
      default:
        throw new Error(`Unsupported rollback type: ${fix.type}`);
    }
  }

  /**
   * Rollback file changes
   */
  async rollbackFileChanges(rollbackData) {
    const { files } = rollbackData;
    const results = [];

    for (const fileData of files) {
      try {
        if (fileData.originalContent !== undefined) {
          // Restore original content
          fs.writeFileSync(fileData.path, fileData.originalContent, 'utf8');
          results.push({ path: fileData.path, status: 'restored' });
        } else if (fileData.wasCreated) {
          // Remove file that was created
          fs.unlinkSync(fileData.path);
          results.push({ path: fileData.path, status: 'removed' });
        }
      } catch (error) {
        results.push({ 
          path: fileData.path, 
          status: 'error', 
          error: error.message 
        });
      }
    }

    return { files: results };
  }

  /**
   * Rollback command execution
   */
  async rollbackCommand(rollbackData) {
    // Commands usually can't be directly rolled back
    // This would depend on the specific command and context
    return {
      message: 'Command rollback not implemented',
      rollbackCommand: rollbackData.rollbackCommand
    };
  }

  /**
   * Find a fix by ID
   */
  findFix(fixId) {
    return this.fixHistory.find(f => f.id === fixId) ||
           this.currentSession?.fixes.find(f => f.id === fixId);
  }

  /**
   * Get session duration
   */
  getSessionDuration() {
    if (!this.currentSession) return 0;
    
    const start = new Date(this.currentSession.startTime);
    const end = this.currentSession.endTime ? 
                new Date(this.currentSession.endTime) : 
                new Date();
    
    return end - start;
  }

  /**
   * Save state to file
   */
  async saveState(type, id, data) {
    const stateFile = path.join(this.stateDir, `${type}-${id}.json`);
    
    const stateData = {
      type,
      id,
      version: '1.0',
      timestamp: new Date().toISOString(),
      data
    };

    fs.writeFileSync(stateFile, JSON.stringify(stateData, null, 2), 'utf8');
  }

  /**
   * Load state from file
   */
  async loadState(type, id) {
    const stateFile = path.join(this.stateDir, `${type}-${id}.json`);
    
    if (!fs.existsSync(stateFile)) {
      return null;
    }

    try {
      const content = fs.readFileSync(stateFile, 'utf8');
      const stateData = JSON.parse(content);
      return stateData.data;
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Failed to load state ${type}:${id}: ${error.message}`));
      return null;
    }
  }

  /**
   * List all sessions
   */
  async listSessions() {
    const files = fs.readdirSync(this.stateDir);
    const sessionFiles = files.filter(f => f.startsWith('session-'));
    const sessions = [];

    for (const file of sessionFiles) {
      try {
        const content = fs.readFileSync(path.join(this.stateDir, file), 'utf8');
        const stateData = JSON.parse(content);
        sessions.push(stateData.data);
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Failed to load session from ${file}: ${error.message}`));
      }
    }

    return sessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  }

  /**
   * Get session history
   */
  async getSessionHistory(limit = 10) {
    const sessions = await this.listSessions();
    return sessions.slice(0, limit);
  }

  /**
   * Clean up old state files
   */
  async cleanup(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days default
    const cutoff = Date.now() - maxAge;
    const files = fs.readdirSync(this.stateDir);
    let cleaned = 0;

    for (const file of files) {
      const filePath = path.join(this.stateDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime.getTime() < cutoff) {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    }

    console.log(chalk.gray(`🧹 Cleaned up ${cleaned} old state files`));
    return cleaned;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Get current session
   */
  getCurrentSession() {
    return this.currentSession;
  }

  /**
   * Get fix history
   */
  getFixHistory() {
    return [...this.fixHistory];
  }

  /**
   * Export session data
   */
  async exportSession(sessionId) {
    const session = await this.loadState(STATE_TYPES.SESSION, sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const exportData = {
      session,
      fixes: [],
      analyses: []
    };

    // Load associated fixes and analyses
    for (const fix of session.fixes) {
      const fixData = await this.loadState(STATE_TYPES.FIX, fix.id);
      if (fixData) exportData.fixes.push(fixData);
    }

    for (const analysis of session.analyses) {
      const analysisData = await this.loadState(STATE_TYPES.ANALYSIS, analysis.id);
      if (analysisData) exportData.analyses.push(analysisData);
    }

    return exportData;
  }
}

// Export singleton instance
export const stateManager = new StateManager();