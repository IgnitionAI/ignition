#!/bin/bash
set -e

echo "🔨 Building all packages..."
pnpm -r run build

echo ""
echo "🧪 Running all tests..."
pnpm -r run test

echo ""
echo "📦 Publishing packages in dependency order..."
echo ""

# Order matters: core first (no deps), then packages that depend on core, then umbrella
pnpm --filter @ignitionai/core publish --access public --no-git-checks
echo "  ✅ @ignitionai/core"

pnpm --filter @ignitionai/storage publish --access public --no-git-checks
echo "  ✅ @ignitionai/storage"

pnpm --filter @ignitionai/environments publish --access public --no-git-checks
echo "  ✅ @ignitionai/environments"

pnpm --filter @ignitionai/backend-tfjs publish --access public --no-git-checks
echo "  ✅ @ignitionai/backend-tfjs"

pnpm --filter @ignitionai/backend-onnx publish --access public --no-git-checks
echo "  ✅ @ignitionai/backend-onnx"

# Umbrella — depends on all of the above
pnpm --filter ignitionai publish --access public --no-git-checks
echo "  ✅ ignitionai"

echo ""
echo "🎉 All packages published!"
echo ""
echo "Users can now run:"
echo "  npm install ignitionai"
