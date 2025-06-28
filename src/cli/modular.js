#!/usr/bin/env node
/**
 * Enhanced Modular CLI - Demonstration of new plugin architecture
 * 
 * This is a proof-of-concept CLI that shows how the new modular
 * system works alongside the existing Cloi functionality.
 */

import chalk from 'chalk';
import yargs from 'yargs';
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
        });
    })
    
    // System status
    .command('status', 'Show system status', {}, async (argv) => {
      await systemStatus(argv);
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
  console.log(chalk.blue('📤 Session export not yet implemented'));
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

// Run the CLI
main().catch(error => {
  console.error(chalk.red('❌ CLI Error:'), error.message);
  process.exit(1);
});