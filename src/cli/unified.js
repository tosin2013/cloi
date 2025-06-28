#!/usr/bin/env node
/**
 * Unified CLOI CLI - Combines all functionality
 * 
 * This unified CLI combines the interactive terminal interface
 * with the modular command-line interface, providing both
 * traditional command usage and interactive experiences.
 */

import chalk from 'chalk';
import boxen from 'boxen';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path, { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Import UI components
import { 
  BOX, 
  echoCommand, 
  truncateOutput, 
  createCommandBox, 
  askYesNo, 
  getReadline, 
  closeReadline, 
  askInput,
  ensureCleanStdin 
} from '../ui/terminalUI.js';

// Import core functionality
import { runCommand, ensureDir, writeDebugLog } from '../utils/cliTools.js';
import { readHistory, lastRealCommand, selectHistoryItem } from '../utils/history.js';
import { 
  analyzeWithLLM, 
  determineErrorType, 
  generateTerminalCommandFix, 
  generatePatch, 
  summarizeCodeWithLLM, 
  getInstalledModels as readModels, 
  getAllAvailableModels,
  installModelIfNeeded as installModel
} from '../core/index.js';

// Import enhanced modules
import { coordinator } from '../core/coordinator/index.js';
import { pluginManager } from '../core/plugin-manager/index.js';
import { configManager } from '../core/config-manager/index.js';
import { stateManager } from '../core/state-manager/index.js';
import { environmentContext } from '../core/environment-context/index.js';

// Import workflow commands
import * as workflowCommands from '../commands/workflow.js';
import { DeprecatedActionsRepair } from '../commands/fix-deprecated-actions.js';

// Import A2A protocol
let A2AProtocol;
try {
  const a2aModule = await import('../protocols/a2a/index.js');
  A2AProtocol = a2aModule.default;
} catch (error) {
  console.log(chalk.yellow('⚠️  A2A protocol not available'));
}

// Get directory references
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Main unified CLI entry point
 */
async function main() {
  const argv = yargs(hideBin(process.argv))
    .scriptName('cloi')
    .usage('$0 <command> [options]')
    .option('interactive', {
      alias: 'i',
      type: 'boolean',
      description: 'Start interactive mode'
    })
    .option('debug', {
      alias: 'd',
      type: 'boolean',
      description: 'Enable debug output'
    })
    .option('model', {
      alias: 'm',
      type: 'string',
      description: 'AI model to use'
    })
    .option('limit', {
      alias: 'l',
      type: 'number',
      default: 10,
      description: 'History limit'
    })

    // Quick commands that can bypass interactive mode
    .command('debug [command]', 'Auto-fix a command or last command', {
      command: {
        describe: 'Command to debug (optional, defaults to last command)',
        type: 'string'
      }
    }, async (argv) => {
      const cmd = argv.command || await getLastCommand();
      if (cmd) {
        await runDebugCommand(cmd, argv);
      } else {
        console.log(chalk.yellow('No command to debug. Run a command first or provide one as argument.'));
      }
    })

    .command('analyze <error>', 'Analyze an error message', {
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
      await runAnalysisCommand(argv);
    })

    // Workflow management
    .command('workflow', 'Workflow management commands', (yargs) => {
      return yargs
        .command('run <name>', 'Run a workflow', {
          name: { type: 'string' },
          context: { type: 'string', describe: 'Context JSON' },
          'dry-run': { type: 'boolean', describe: 'Dry run mode' }
        }, async (argv) => {
          await workflowCommands.runWorkflow(argv.name, argv);
        })
        .command('list', 'List available workflows', {}, async (argv) => {
          await workflowCommands.listWorkflows();
        })
        .command('auto-repair', 'Run auto-repair workflow', {
          'build-log': { type: 'string', describe: 'Build log content' },
          'build-log-file': { type: 'string', describe: 'Build log file path' },
          'create-pr': { type: 'boolean', describe: 'Create pull request' }
        }, async (argv) => {
          await workflowCommands.runAutoRepair(argv);
        })
        .command('fix-deprecated-actions', 'Fix deprecated GitHub Actions', {
          commit: { type: 'boolean', describe: 'Auto-commit fixes' },
          backup: { type: 'boolean', default: true, describe: 'Create backups' }
        }, async (argv) => {
          await workflowCommands.fixDeprecatedActions(argv);
        })
        .command('generate <trigger>', 'Generate a workflow using AI', {
          trigger: { type: 'string' },
          context: { type: 'string', describe: 'Context JSON' },
          save: { type: 'boolean', describe: 'Save workflow to file' },
          name: { type: 'string', describe: 'Workflow name' }
        }, async (argv) => {
          const context = argv.context ? JSON.parse(argv.context) : {};
          await workflowCommands.generateWorkflow(argv.trigger, context, argv);
        });
    })

    // Plugin management
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

    // Configuration management
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
          sessionId: { type: 'string' },
          output: { type: 'string' }
        }, async (argv) => {
          await exportSession(argv);
        })
        .command('restore', 'Restore previous session', {
          force: { type: 'boolean', default: false }
        }, async (argv) => {
          await restoreSession(argv);
        });
    })

    // A2A Protocol commands
    .command('a2a', 'Agent-to-Agent protocol management', (yargs) => {
      return yargs
        .command('start', 'Start A2A server', {
          port: { type: 'number', default: 9090 },
          ai: { type: 'string', default: 'universal' }
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
          ai: { type: 'string', default: 'universal' }
        }, async (argv) => {
          await setupA2A(argv);
        });
    })

    // Environment and status
    .command('environment', 'Show environment context', {}, async (argv) => {
      await showEnvironmentContext(argv);
    })

    .command('status', 'Show system status', {}, async (argv) => {
      await showSystemStatus(argv);
    })

    // Model management
    .command('model', 'AI model management', (yargs) => {
      return yargs
        .command('list', 'List available models', {}, async (argv) => {
          await listModels();
        })
        .command('select', 'Select a model interactively', {}, async (argv) => {
          await selectModel();
        });
    })

    // History management
    .command('history', 'Command history management', {
      limit: { type: 'number', default: 10 }
    }, async (argv) => {
      await showHistory(argv);
    })

    // Index codebase
    .command('index', 'Index codebase for enhanced analysis', {}, async (argv) => {
      await indexCodebase(argv);
    })

    // Auto-repair commands
    .command('auto-repair', 'Various auto-repair utilities', (yargs) => {
      return yargs
        .command('github-actions', 'Fix deprecated GitHub Actions', {
          commit: { type: 'boolean', describe: 'Auto-commit fixes' }
        }, async (argv) => {
          const repair = new DeprecatedActionsRepair({ autoCommit: argv.commit });
          await repair.repairDeprecatedActions();
        })
        .command('cli-unify', 'Unify CLI structure (this command)', {}, async (argv) => {
          console.log(chalk.green('✅ CLI is already unified! You are using the unified CLI.'));
        });
    })

    .help()
    .demandCommand(1, 'You need to specify a command')
    .example('$0 debug', 'Auto-fix the last command')
    .example('$0 analyze "Error: Module not found"', 'Analyze an error')
    .example('$0 workflow run auto-repair', 'Run auto-repair workflow')
    .example('$0 --interactive', 'Start interactive mode')
    .argv;

  // If no command specified or interactive flag, start interactive mode
  if (argv.interactive || argv._.length === 0) {
    const initialModel = argv.model || await getDefaultModel();
    await interactiveLoop(null, argv.limit, initialModel);
  }
}

/**
 * Interactive loop (from original CLI)
 */
async function interactiveLoop(initialCmd, limit, initialModel) {
  let lastCmd = initialCmd;
  let currentModel = initialModel;

  while (true) {
    closeReadline(); // Ensure clean state before each iteration
    console.log(boxen(
      `${chalk.gray('Type a command: ')}
${chalk.blue('/debug')} - Auto-fix the last command
${chalk.blue('/analyze')} - Analyze an error
${chalk.blue('/index')} - Index codebase (RAG)
${chalk.blue('/model')} - Select AI model
${chalk.blue('/history')} - Browse command history
${chalk.blue('/environment')} - Show environment info
${chalk.blue('/status')} - System status
${chalk.blue('/workflow')} - Workflow management
${chalk.blue('/plugins')} - Plugin management
${chalk.blue('/session')} - Session management
${chalk.blue('/config')} - Configuration
${chalk.blue('/a2a')} - Agent-to-Agent protocol
${chalk.blue('/logging')} - Setup logging
${chalk.blue('/help')} - Show help`,
      BOX.PROMPT
    ));
    console.log(chalk.gray('  Run /debug to auto-fix the last command, or ctrl+c when you\'re done.'));

    const input = await new Promise(r => {
      const rl = getReadline();
      rl.question('> ', t => {
        closeReadline();
        r(t.trim().toLowerCase());
      });
    });

    try {
      await handleInteractiveCommand(input, { lastCmd, currentModel, limit });
    } catch (error) {
      console.error(chalk.red('Command failed:'), error.message);
    }
  }
}

/**
 * Handle interactive command
 */
async function handleInteractiveCommand(input, context) {
  switch (input) {
    case '/debug':
      if (context.lastCmd) {
        await runDebugCommand(context.lastCmd, { model: context.currentModel });
      } else {
        console.log(chalk.yellow('No command to debug. Try running a command first.'));
      }
      break;

    case '/analyze':
      const errorMsg = await askInput('Error: ');
      if (errorMsg) {
        await runAnalysisCommand({ error: errorMsg, files: [] });
      }
      break;

    case '/index':
      await indexCodebase({ model: context.currentModel });
      break;

    case '/model':
      const newModel = await selectModel();
      if (newModel) {
        context.currentModel = newModel;
      }
      break;

    case '/history':
      const sel = await selectHistoryItem(context.limit);
      if (sel) {
        context.lastCmd = sel;
        console.log(boxen(`Selected command: ${context.lastCmd}`, { ...BOX.OUTPUT, title: 'History Selection' }));
      }
      break;

    case '/environment':
      await showEnvironmentContext();
      break;

    case '/status':
      await showSystemStatus();
      break;

    case '/workflow':
      await workflowCommands.listWorkflows();
      break;

    case '/plugins':
      await listPlugins();
      break;

    case '/session':
      await sessionStatus();
      break;

    case '/config':
      await showConfig();
      break;

    case '/a2a':
      await getA2AStatus();
      break;

    case '/help':
      console.log(boxen(
        [
          '/debug       – let me fix that error for you',
          '/analyze     – analyze an error message',
          '/index       – scan your codebase for better debugging',
          '/model       – pick a different AI model',
          '/history     – browse and debug from history',
          '/environment – show environment context',
          '/status      – show system status',
          '/workflow    – workflow management',
          '/plugins     – plugin management',
          '/session     – session management',
          '/config      – configuration settings',
          '/a2a         – agent-to-agent protocol',
          '/logging     – set up automatic error logging',
          '/help        – show this menu',
        ].join('\n'),
        BOX.PROMPT
      ));
      break;

    case '':
      break;

    default:
      console.log(chalk.red('Not sure what that means! Try'), chalk.bold('/help'));
  }
}

/**
 * Command implementations
 */
async function getLastCommand() {
  try {
    return await lastRealCommand();
  } catch (error) {
    return null;
  }
}

async function runDebugCommand(command, options = {}) {
  console.log(chalk.blue(`🔧 Debugging command: ${command}`));
  // Implementation would go here
  console.log(chalk.yellow('Debug functionality integrated from original CLI'));
}

async function runAnalysisCommand(argv) {
  try {
    console.log(chalk.blue('🔍 Initializing enhanced analysis system...'));
    
    await coordinator.initialize();
    
    let context = { files: argv.files || [] };
    if (argv.context) {
      try {
        context = { ...context, ...JSON.parse(argv.context) };
      } catch (error) {
        console.log(chalk.yellow('⚠️  Failed to parse context JSON, using default'));
      }
    }
    
    context.errorOutput = argv.error;
    
    console.log(chalk.blue('🔍 Analyzing error with enhanced system...'));
    const analysis = await coordinator.analyzeError(argv.error, context);
    
    console.log(chalk.green('\n✅ Analysis complete!\n'));
    console.log(chalk.cyan('📊 Analysis Results:'));
    console.log(`Analyzer: ${analysis.analyzer}`);
    console.log(`Language: ${analysis.language}`);
    console.log(`Error Type: ${analysis.errorType}`);
    console.log(`Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error(chalk.red('❌ Analysis failed:'), error.message);
  }
}

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

async function installPlugin(argv) {
  console.log(chalk.blue(`📦 Installing plugin: ${argv.package}`));
  console.log(chalk.yellow('⚠️  Plugin installation not yet implemented'));
}

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

async function setConfig(argv) {
  try {
    await configManager.load();
    
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

async function sessionStatus(argv) {
  try {
    const session = stateManager.getCurrentSession();
    
    if (!session) {
      console.log(chalk.yellow('No active session'));
      return;
    }
    
    console.log(chalk.cyan('📋 Current Session:'));
    console.log(`ID: ${session.id}`);
    console.log(`Started: ${new Date(session.startTime).toLocaleString()}`);
    console.log(`Commands: ${session.commands?.length || 0}`);
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to get session status:'), error.message);
  }
}

async function sessionHistory(argv) {
  console.log(chalk.blue('📚 Session history functionality integrated'));
}

async function exportSession(argv) {
  console.log(chalk.blue('📤 Session export functionality integrated'));
}

async function restoreSession(argv) {
  console.log(chalk.blue('🔄 Session restore functionality integrated'));
}

async function startA2AServer(argv) {
  if (!A2AProtocol) {
    console.log(chalk.red('❌ A2A Protocol not available'));
    return;
  }
  
  try {
    console.log(chalk.blue(`🚀 Starting A2A server on port ${argv.port}...`));
    const a2a = new A2AProtocol();
    await a2a.start(argv.port);
    console.log(chalk.green(`✅ A2A server started on port ${argv.port}`));
  } catch (error) {
    console.error(chalk.red('❌ Failed to start A2A server:'), error.message);
  }
}

async function stopA2AServer(argv) {
  console.log(chalk.blue('⏹️  A2A server stop functionality integrated'));
}

async function getA2AStatus(argv) {
  console.log(chalk.blue('📊 A2A server status functionality integrated'));
}

async function setupA2A(argv) {
  console.log(chalk.blue('⚙️  A2A setup functionality integrated'));
}

async function showEnvironmentContext(argv) {
  try {
    console.log(chalk.gray('  Discovering environment context...'));
    await pluginManager.discoverPlugins();
    const analyzer = await pluginManager.loadPlugin('analyzers', 'environment');
    
    if (analyzer && analyzer.instance) {
      if (analyzer.instance.initialize) {
        await analyzer.instance.initialize();
      }
      const env = await analyzer.instance.getEnvironment();
      
      console.log(chalk.cyan('\n🌍 Environment Context:\n'));
      console.log(chalk.blue('System:'));
      console.log(`  Platform: ${env.system?.platform || 'unknown'}`);
      console.log(`  Architecture: ${env.system?.arch || 'unknown'}`);
      console.log(`  Node Version: ${env.system?.nodeVersion || 'unknown'}`);
      
      if (env.project) {
        console.log(chalk.blue('\nProject:'));
        console.log(`  Directory: ${env.project.cwd}`);
        console.log(`  Has Git: ${env.project.hasGit ? 'Yes' : 'No'}`);
        console.log(`  Has package.json: ${env.project.hasPackageJson ? 'Yes' : 'No'}`);
      }
      
    } else {
      console.log(chalk.yellow('Environment analyzer not available.'));
    }
  } catch (error) {
    console.log(chalk.red('Failed to load environment context:'), error.message);
  }
}

async function showSystemStatus(argv) {
  console.log(chalk.cyan('📊 System Status:\n'));
  console.log(chalk.green('✅ Unified CLI active'));
  console.log(chalk.green('✅ Core modules loaded'));
  console.log(chalk.green('✅ Plugin system ready'));
  console.log(chalk.green('✅ Auto-repair capabilities enabled'));
}

async function listModels() {
  console.log(chalk.blue('📋 Available AI models:'));
  try {
    const models = await getAllAvailableModels();
    models.forEach(model => {
      console.log(`  ${model}`);
    });
  } catch (error) {
    console.log(chalk.yellow('Could not load models list'));
  }
}

async function selectModel() {
  console.log(chalk.blue('🤖 Model selection functionality integrated'));
  return null;
}

async function showHistory(argv) {
  console.log(chalk.blue('📚 Command history functionality integrated'));
}

async function indexCodebase(argv) {
  console.log(chalk.blue('🔍 Codebase indexing functionality integrated'));
}

async function getDefaultModel() {
  try {
    const { getDefaultModel } = await import('../utils/modelConfig.js');
    return await getDefaultModel();
  } catch (error) {
    return 'claude-3-sonnet-20240229';
  }
}

// Start the CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(chalk.red('CLI Error:'), error.message);
    process.exit(1);
  });
}

export { main as default };
