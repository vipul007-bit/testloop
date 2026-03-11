#!/bin/bash
# ============================================================
# OmniShield — GitHub Setup & v0.1 Tag
# Run once from the project root: bash setup_github.sh
# ============================================================

set -e

REPO_NAME="omnishield"
BRANCH="main"

echo ""
echo "🛡️  OmniShield — GitHub Repository Setup"
echo "============================================"

# 1. Initialise git if not already done
if [ ! -d ".git" ]; then
  echo "→ Initialising git repository..."
  git init
  git checkout -b $BRANCH
else
  echo "→ Git already initialised"
fi

# 2. Create .gitignore if missing
if [ ! -f ".gitignore" ]; then
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
*.local
.DS_Store
*.log
.vite/
coverage/
__pycache__/
*.pyc
.env.local
EOF
fi

# 3. Stage all files
echo "→ Staging files..."
git add .

# 4. Initial commit
echo "→ Creating initial commit..."
git commit -m "feat: OmniShield v0.1 — Smart Healthcare Disease Surveillance PWA

Core features:
- Doctor Portal: QR scan + GPS-tagged diagnosis logging
- Offline-first: IndexedDB queue + Background Sync auto-drain
- DBSCAN hotspot detection (sklearn + PostGIS ST_ClusterDBSCAN)
- Differential Privacy: Laplace noise on public analytics
- E2EE patient records: AES-GCM-256 via SubtleCrypto
- Local Differential Privacy: Randomised Response ε=0.75
- Real-time clusters via pg_notify → WebSocket broadcast
- Claude API-powered clinical decision support chatbot
- India SVG map with precise geographic coordinates

Stack: React 18 + Vite PWA / Node.js + Express + PostGIS / Python scikit-learn"

# 5. Tag v0.1
echo "→ Tagging v0.1..."
git tag -a v0.1 -m "OmniShield v0.1 — First mentoring round submission

Demo flows verified:
✅ QR scan → load patient → log diagnosis → history updates immediately
✅ Offline mode → log → reconnect → auto-sync to backend
✅ DBSCAN detects 5 hotspot clusters from 29 mock records
✅ DP analytics: exact vs Laplace-noised public counts (ε slider)
✅ Claude AI chatbot with clinical decision support"

echo ""
echo "✅ Local repo ready. Now push to GitHub:"
echo ""
echo "   1. Create a new repo at https://github.com/new"
echo "      Name: $REPO_NAME  |  Private: No  |  Init: No"
echo ""
echo "   2. Then run:"
echo "      git remote add origin https://github.com/YOUR_USERNAME/$REPO_NAME.git"
echo "      git push -u origin $BRANCH"
echo "      git push origin v0.1"
echo ""
echo "   3. Verify tag at:"
echo "      https://github.com/YOUR_USERNAME/$REPO_NAME/releases/tag/v0.1"
echo ""
