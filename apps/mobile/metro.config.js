const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [monorepoRoot]

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// Prevent Metro from traversing pnpm's virtual store (.pnpm) and creating
// duplicate module instances (causes "getDevServer is not a function" in RN).
config.resolver.disableHierarchicalLookup = true

module.exports = config
