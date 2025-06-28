#!/usr/bin/env node
/**
 * Enhanced Modular CLI - Demonstration of new plugin architecture
 * 
 * This is a proof-of-concept CLI that shows how the new modular
 * system works alongside the existing Cloi functionality.
 */

import chalk from 'chalk';
import yargs from 'yargs';
import path from 'path';
import { hideBin } from 'yargs/helpers';
import { coordinator } from '../core/coordinator/index.js';
import { pluginManager } from '../core/plugin-manager/index.js';
import { configManager } from '../core/config-manager/index.js';
import { stateManager } from '../core/state-manager/index.js';

/**
 * Enhanced CLI Commands
 */
async function main() {
  const argv = yargs(hideBin(process.argv))
    .scriptName('cloi-enhanced')
    .usage('$0 <command> [options]')
    .option('debug', {
      alias: 'd',
      type: 'boolean',
      description: 'Enable debug output'
    })
    .option('config', {
      alias: 'c',
      type: 'string',
      description: 'Path to configuration file'
    })
    
    // Plugin management commands
    .command('plugins', 'Plugin management commands', (yargs) => {
      return yargs
        .command('list', 'List all available plugins', {}, async (argv) => {
          await listPlugins(argv);
        })
        .command('load <plugin>', 'Load a specific plugin', {
          plugin: {
            describe: 'Plugin name in format type:name',
            type: 'string'
          }
        }, async (argv) => {
          await loadPlugin(argv);
        })
        .command('install <package>', 'Install a plugin from npm', {
          package: {
            describe: 'npm package name',
            type: 'string'
          }
        }, async (argv) => {
          await installPlugin(argv);
        });
    })
    
    // Analysis commands
    .command('analyze <error>', 'Analyze an error using the modular system', {
      error: {
        describe: 'Error message or file containing error',
        type: 'string'
      },
      files: {
        describe: 'Files related to the error',
        type: 'array',
        default: []
      },
      context: {
        describe: 'Additional context (JSON string)',
        type: 'string'
      }
    }, async (argv) => {
      await analyzeError(argv);
    })
    
    // Fix generation and application
    .command('fix <analysis>', 'Generate and optionally apply a fix', {
      analysis: {
        describe: 'Analysis result (JSON file or string)',
        type: 'string'
      },
      apply: {
        describe: 'Apply the fix automatically',
        type: 'boolean',
        default: false
      },
      backup: {
        describe: 'Create backup before applying fix',
        type: 'boolean',
        default: true
      }
    }, async (argv) => {
      await generateAndApplyFix(argv);
    })
    
    // Configuration commands
    .command('config', 'Configuration management', (yargs) => {
      return yargs
        .command('show', 'Show current configuration', {}, async (argv) => {
          await showConfig(argv);
        })
        .command('set <key> <value>', 'Set configuration value', {
          key: { type: 'string' },
          value: { type: 'string' },
          scope: {
            describe: 'Configuration scope (user, project, system)',
            type: 'string',
            default: 'user'
          }
        }, async (argv) => {
          await setConfig(argv);
        });
    })
    
    // Session management
    .command('session', 'Session management', (yargs) => {
      return yargs
        .command('status', 'Show current session status', {}, async (argv) => {
          await sessionStatus(argv);
        })
        .command('history [limit]', 'Show session history', {
          limit: {
            describe: 'Number of sessions to show',
            type: 'number',
            default: 10
          }
        }, async (argv) => {
          await sessionHistory(argv);
        })
        .command('export <sessionId>', 'Export session data', {
          sessionId: {
            describe: 'Session ID to export',
            type: 'string'
          },
          output: {
            describe: 'Output file',
            type: 'string'
          }
        }, async (argv) => {
          await exportSession(argv);
        })
        .command('restore', 'Restore previous session', {
          force: {
            describe: 'Force restore even if current session exists',
            type: 'boolean',
            default: false
          }
        }, async (argv) => {
          await restoreSession(argv);
        })
        .command('recovery-info', 'Show session recovery information', {}, async (argv) => {
          await showRecoveryInfo(argv);
        });
    })
    
    // System status
    .command('status', 'Show system status', {}, async (argv) => {
      await systemStatus(argv);
    })
    
    // A2A Protocol commands
    .command('a2a', 'Agent-to-Agent protocol management', (yargs) => {
      return yargs
        .command('start', 'Start A2A server', {
          port: {
            describe: 'Port for A2A server',
            type: 'number',
            default: 9090
          },
          ai: {
            describe: 'AI integration type',
            type: 'string',
            default: 'universal'
          }
        }, async (argv) => {
          await startA2AServer(argv);
        })
        .command('stop', 'Stop A2A server', {}, async (argv) => {
          await stopA2AServer(argv);
        })
        .command('status', 'Show A2A server status', {}, async (argv) => {
          await getA2AStatus(argv);
        })
        .command('setup', 'Setup A2A integration', {
          ai: {
            describe: 'AI system to setup (claude-code, universal)',
            type: 'string',
            default: 'universal'
          }
        }, async (argv) => {
          await setupA2A(argv);
        })
        .command('prompt <type>', 'Show integration prompts', {
          type: {
            describe: 'Prompt type (claude-code, universal)',
            type: 'string'
          }
        }, async (argv) => {
          await showA2APrompt(argv);
        });
    })
    
    .help()
    .argv;
}

/**
 * List all available plugins
 */
async function listPlugins(argv) {
  console.log(chalk.blue('🔍 Discovering plugins...'));
  
  try {
    await pluginManager.discoverPlugins();
    const plugins = pluginManager.listPlugins();
    
    if (plugins.length === 0) {
      console.log(chalk.yellow('No plugins found'));
      return;
    }
    
    console.log(chalk.green(`\n📦 Found ${plugins.length} plugins:\n`));
    
    // Group by type
    const byType = {};
    plugins.forEach(plugin => {
      if (!byType[plugin.type]) byType[plugin.type] = [];
      byType[plugin.type].push(plugin);
    });
    
    for (const [type, typePlugins] of Object.entries(byType)) {
      console.log(chalk.cyan(`${type.toUpperCase()}:`));
      typePlugins.forEach(plugin => {
        const status = plugin.loaded ? chalk.green('✅') : chalk.gray('⚪');
        console.log(`  ${status} ${plugin.name} v${plugin.version} - ${plugin.description}`);
      });
      console.log();
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to list plugins:'), error.message);
  }
}

/**
 * Load a specific plugin
 */
async function loadPlugin(argv) {
  const [type, name] = argv.plugin.split(':');
  
  if (!type || !name) {
    console.error(chalk.red('❌ Invalid plugin format. Use: type:name'));
    return;
  }
  
  try {
    console.log(chalk.blue(`📦 Loading plugin: ${type}:${name}`));
    await pluginManager.discoverPlugins();
    const plugin = await pluginManager.loadPlugin(type, name);
    
    console.log(chalk.green(`✅ Plugin loaded successfully`));
    console.log(`Name: ${plugin.name}`);
    console.log(`Version: ${plugin.version}`);
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to load plugin:'), error.message);
  }
}

/**
 * Install a plugin from npm
 */
async function installPlugin(argv) {
  console.log(chalk.blue(`📦 Installing plugin: ${argv.package}`));
  console.log(chalk.yellow('⚠️  Plugin installation not yet implemented'));
  console.log('This feature will allow installing plugins from npm registry');
}

/**
 * Analyze an error using the modular system
 */
async function analyzeError(argv) {
  try {
    console.log(chalk.blue('🔍 Initializing enhanced analysis system...'));
    
    // Initialize the coordinator
    await coordinator.initialize();
    
    // Parse context if provided
    let context = { files: argv.files };
    if (argv.context) {
      try {
        context = { ...context, ...JSON.parse(argv.context) };
      } catch (error) {
        console.log(chalk.yellow('⚠️  Failed to parse context JSON, using default'));
      }
    }
    
    // Add error output to context
    context.errorOutput = argv.error;
    
    console.log(chalk.blue('🔍 Analyzing error with enhanced system...'));
    
    // Perform analysis
    const analysis = await coordinator.analyzeError(argv.error, context);
    
    console.log(chalk.green('\n✅ Analysis complete!\n'));
    
    // Display results
    console.log(chalk.cyan('📊 Analysis Results:'));
    console.log(`Analyzer: ${analysis.analyzer}`);
    console.log(`Language: ${analysis.language}`);
    console.log(`Framework: ${Array.isArray(analysis.framework) ? analysis.framework.join(', ') : analysis.framework}`);
    console.log(`Error Type: ${analysis.errorType}`);
    console.log(`Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
    
    if (analysis.suggestions && analysis.suggestions.length > 0) {
      console.log(chalk.cyan('\n💡 Suggestions:'));
      analysis.suggestions.forEach((suggestion, index) => {
        const priority = suggestion.priority === 'high' ? chalk.red('HIGH') :
                        suggestion.priority === 'medium' ? chalk.yellow('MED') :
                        chalk.gray('LOW');
        console.log(`${index + 1}. [${priority}] ${suggestion.title}`);
        console.log(`   ${suggestion.description}`);
        if (suggestion.command) {
          console.log(`   Command: ${chalk.green(suggestion.command)}`);
        }
      });
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Analysis failed:'), error.message);
    if (argv.debug) {
      console.error(error.stack);
    }
  }
}

/**
 * Generate and apply fix
 */
async function generateAndApplyFix(argv) {
  console.log(chalk.blue('🛠️  Fix generation not yet fully implemented'));
  console.log('This will integrate with the fixer plugins to apply changes');
}

/**
 * Show configuration
 */
async function showConfig(argv) {
  try {
    await configManager.load();
    const config = configManager.getAll();
    
    console.log(chalk.cyan('🔧 Current Configuration:\n'));
    console.log(JSON.stringify(config, null, 2));
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to load configuration:'), error.message);
  }
}

/**
 * Set configuration value
 */
async function setConfig(argv) {
  try {
    await configManager.load();
    
    // Parse value
    let value = argv.value;
    try {
      value = JSON.parse(argv.value);
    } catch {
      // Keep as string
    }
    
    configManager.set(argv.key, value);
    await configManager.save(argv.scope);
    
    console.log(chalk.green(`✅ Configuration updated: ${argv.key} = ${JSON.stringify(value)}`));
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to set configuration:'), error.message);
  }
}

/**
 * Show session status
 */
async function sessionStatus(argv) {
  try {
    const session = stateManager.getCurrentSession();
    
    if (!session) {
      console.log(chalk.yellow('No active session'));
      return;
    }
    
    console.log(chalk.cyan('📝 Current Session:'));
    console.log(`ID: ${session.id}`);
    console.log(`Started: ${session.startTime}`);
    console.log(`Duration: ${Math.round(stateManager.getSessionDuration() / 1000)}s`);
    console.log(`Fixes: ${session.fixes.length}`);
    console.log(`Analyses: ${session.analyses.length}`);
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to get session status:'), error.message);
  }
}

/**
 * Show session history
 */
async function sessionHistory(argv) {
  try {
    const history = await stateManager.getSessionHistory(argv.limit);
    
    if (history.length === 0) {
      console.log(chalk.yellow('No session history found'));
      return;
    }
    
    console.log(chalk.cyan(`📚 Session History (${history.length} sessions):\n`));
    
    history.forEach((session, index) => {
      const duration = session.endTime ? 
        Math.round((new Date(session.endTime) - new Date(session.startTime)) / 1000) : 
        'ongoing';
        
      console.log(`${index + 1}. ${session.id}`);
      console.log(`   Started: ${session.startTime}`);
      console.log(`   Duration: ${duration}s`);
      console.log(`   Fixes: ${session.fixes.length}, Analyses: ${session.analyses.length}`);
      console.log();
    });
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to get session history:'), error.message);
  }
}

/**
 * Export session data
 */
async function exportSession(argv) {
  try {
    const exportData = await stateManager.exportSession(argv.sessionId);
    
    const outputFile = argv.output || `session-${argv.sessionId}-${Date.now()}.json`;
    const fs = await import('fs/promises');
    
    await fs.writeFile(outputFile, JSON.stringify(exportData, null, 2));
    
    console.log(chalk.green(`✅ Session exported to: ${outputFile}`));
    console.log(chalk.cyan(`Session: ${exportData.session.id}`));
    console.log(chalk.cyan(`Fixes: ${exportData.fixes.length}`));
    console.log(chalk.cyan(`Analyses: ${exportData.analyses.length}`));
    
  } catch (error) {
    console.error(chalk.red('❌ Export failed:'), error.message);
  }
}

/**
 * Restore previous session
 */
async function restoreSession(argv) {
  try {
    // Check if we have a current session and force flag
    const currentSession = stateManager.getCurrentSession();
    if (currentSession && !argv.force) {
      console.log(chalk.yellow('⚠️  Active session exists. Use --force to override'));
      console.log(`Current session: ${currentSession.id}`);
      return;
    }

    // Get recovery info first
    const recoveryInfo = await stateManager.getSessionRecoveryInfo();
    if (!recoveryInfo) {
      console.log(chalk.yellow('📂 No session available for restoration'));
      return;
    }

    if (!recoveryInfo.canRestore) {
      console.log(chalk.yellow('⚠️  Previous session was properly ended, cannot restore'));
      return;
    }

    // Initialize state manager to trigger restoration
    await stateManager.initialize();
    
    const restored = stateManager.getCurrentSession();
    if (restored) {
      console.log(chalk.green('✅ Session restored successfully'));
    } else {
      console.log(chalk.yellow('⚠️  No session was restored'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Session restoration failed:'), error.message);
  }
}

/**
 * Show session recovery information
 */
async function showRecoveryInfo() {
  try {
    const recoveryInfo = await stateManager.getSessionRecoveryInfo();
    
    if (!recoveryInfo) {
      console.log(chalk.yellow('📂 No session recovery information available'));
      return;
    }

    console.log(chalk.cyan('🔄 Session Recovery Information:\n'));
    console.log(`Session ID: ${recoveryInfo.sessionId}`);
    console.log(`Started: ${recoveryInfo.startTime}`);
    console.log(`Status: ${recoveryInfo.status}`);
    console.log(`Fixes: ${recoveryInfo.fixCount}`);
    console.log(`Analyses: ${recoveryInfo.analysisCount}`);
    console.log(`Can Restore: ${recoveryInfo.canRestore ? chalk.green('Yes') : chalk.red('No')}`);
    
    if (recoveryInfo.canRestore) {
      console.log(chalk.cyan('\n💡 Use "cloi session restore" to restore this session'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to get recovery info:'), error.message);
  }
}

/**
 * Show system status
 */
async function systemStatus(argv) {
  try {
    // Try to initialize if not already done
    if (!coordinator.initialized) {
      await coordinator.initialize();
    }
    
    const status = coordinator.getStatus();
    
    console.log(chalk.cyan('🔧 Enhanced Cloi Platform Status:\n'));
    console.log(`Initialized: ${status.initialized ? chalk.green('✅') : chalk.red('❌')}`);
    console.log(`Active Plugins: ${status.activePlugins.length}`);
    console.log(`Current Session: ${status.currentSession || 'None'}`);
    console.log(`Default Provider: ${status.config.defaultProvider}`);
    console.log(`Plugin Auto-load: ${status.config.pluginAutoLoad ? 'Enabled' : 'Disabled'}`);
    
    if (status.activePlugins.length > 0) {
      console.log(chalk.cyan('\n📦 Active Plugins:'));
      status.activePlugins.forEach(plugin => {
        console.log(`  • ${plugin}`);
      });
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to get system status:'), error.message);
    if (argv.debug) {
      console.error(error.stack);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n🛑 Shutting down...'));
  if (coordinator.initialized) {
    await coordinator.shutdown();
  }
  process.exit(0);
});

// Placeholder workflow functions (these need to be implemented)
export async function executeWorkflow(argv) {
  console.log(chalk.blue('🔄 Workflow execution not yet implemented'));
  console.log(`Workflow: ${argv.workflow}`);
}

export async function rollbackWorkflow(argv) {
  console.log(chalk.blue('↩️ Workflow rollback not yet implemented'));
  console.log(`Workflow ID: ${argv.workflowId}`);
}

// A2A Protocol functions
let a2aProtocol = null;

export async function startA2AServer(argv) {
  try {
    console.log(chalk.blue(`🚀 Starting A2A server on port ${argv.port}...`));
    
    // Import A2A protocol
    const A2AProtocol = (await import('../protocols/a2a/index.js')).default;
    
    // Create and configure A2A instance
    a2aProtocol = new A2AProtocol({
      networking: {
        port: argv.port,
        host: 'localhost'
      },
      ai: {
        integration: argv.ai || 'universal'
      }
    });
    
    // Start the protocol
    await a2aProtocol.start();
    
    console.log(chalk.green(`✅ A2A server started successfully on port ${argv.port}`));
    console.log(chalk.cyan(`🔗 External AIs can connect to: ws://localhost:${argv.port}`));
    console.log(chalk.gray('Press Ctrl+C to stop the server'));
    
    // Keep the process alive
    process.stdin.resume();
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to start A2A server:'), error.message);
    if (error.message.includes('node_modules')) {
      console.log(chalk.yellow('💡 Try installing missing dependencies: npm install ws uuid ajv node-cron'));
    }
  }
}

export async function stopA2AServer(argv) {
  try {
    if (!a2aProtocol) {
      console.log(chalk.yellow('⚠️ No A2A server running'));
      return;
    }
    
    console.log(chalk.blue('🛑 Stopping A2A server...'));
    await a2aProtocol.stop();
    a2aProtocol = null;
    
    console.log(chalk.green('✅ A2A server stopped'));
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to stop A2A server:'), error.message);
  }
}

export async function getA2AStatus(argv) {
  try {
    if (!a2aProtocol) {
      console.log(chalk.yellow('📡 A2A Server Status: Not Running'));
      return;
    }
    
    const status = a2aProtocol.getStatus();
    
    console.log(chalk.cyan('📡 A2A Server Status:\n'));
    console.log(`Status: ${chalk.green('Running')}`);
    console.log(`Port: ${status.port || 'N/A'}`);
    console.log(`Agent ID: ${status.agentId}`);
    console.log(`Connected Agents: ${status.connectedAgents || 0}`);
    console.log(`Messages Processed: ${status.messagesProcessed || 0}`);
    console.log(`Uptime: ${Math.round((status.uptime || 0) / 1000)}s`);
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to get A2A status:'), error.message);
  }
}

export async function setupA2A(argv) {
  try {
    console.log(chalk.blue(`🔧 Setting up A2A integration for: ${argv.ai}`));
    
    // Read the appropriate prompt file
    const promptPath = path.join(process.cwd(), 'src/protocols/a2a/prompts');
    let promptFile;
    
    switch (argv.ai) {
      case 'claude-code':
        promptFile = 'claude-code-integration.md';
        break;
      case 'github-copilot':
        promptFile = 'github-copilot-integration.md';
        break;
      default:
        promptFile = 'universal-ai-prompt.md';
    }
    
    const fullPromptPath = path.join(promptPath, promptFile);
    
    try {
      const fs = await import('fs/promises');
      const promptContent = await fs.readFile(fullPromptPath, 'utf8');
      
      console.log(chalk.green('✅ A2A Integration Setup Complete!\n'));
      console.log(chalk.cyan('📋 Integration Instructions:'));
      console.log('─'.repeat(60));
      console.log(promptContent);
      console.log('─'.repeat(60));
      
    } catch (readError) {
      console.log(chalk.yellow('⚠️ Prompt file not found, showing basic setup:'));
      console.log(`
${chalk.cyan('A2A Protocol Setup:')}

1. Start the A2A server:
   ${chalk.green('cloi a2a start --port 9090')}

2. Connect your AI to:
   ${chalk.green('ws://localhost:9090')}

3. Use the universal prompt for AI integration
      `);
    }
    
  } catch (error) {
    console.error(chalk.red('❌ A2A setup failed:'), error.message);
  }
}

export async function showA2APrompt(argv) {
  try {
    console.log(chalk.blue(`📋 Showing A2A integration prompt for: ${argv.type}`));
    
    // Read the appropriate prompt file
    const promptPath = path.join(process.cwd(), 'src/protocols/a2a/prompts');
    let promptFile;
    
    switch (argv.type) {
      case 'claude-code':
        promptFile = 'claude-code-integration.md';
        break;
      case 'universal':
        promptFile = 'universal-ai-prompt.md';
        break;
      default:
        promptFile = 'universal-ai-prompt.md';
    }
    
    const fullPromptPath = path.join(promptPath, promptFile);
    
    try {
      const fs = await import('fs/promises');
      const promptContent = await fs.readFile(fullPromptPath, 'utf8');
      console.log(chalk.green('\n📖 Integration Prompt:\n'));
      console.log(promptContent);
    } catch (readError) {
      console.log(chalk.yellow('⚠️ Prompt file not found'));
      console.log(chalk.cyan(`Expected: ${fullPromptPath}`));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to show A2A prompt:'), error.message);
  }
}

// Export functions for use by main CLI
export {
  listPlugins,
  loadPlugin,
  analyzeError,
  sessionStatus,
  sessionHistory,
  restoreSession,
  showRecoveryInfo,
  exportSession,
  showConfig,
  setConfig,
  systemStatus
};

// Run the CLI only if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(chalk.red('❌ CLI Error:'), error.message);
    process.exit(1);
  });
}