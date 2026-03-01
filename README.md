# DebateClubAI

A premium, modern AI debate platform where multiple AI providers compete head-to-head in structured debates with real-time scoring and analytics.

![DebateClubAI](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- 🤖 **Multi-Provider Support**: OpenAI, Google Gemini, Mistral AI, xAI (Grok), and DeepSeek
- 🏆 **Real-Time Scoring**: Intelligent judge scores each message on multiple criteria
- ⚡ **Live Updates**: Watch debates unfold in real-time with dynamic phase transitions
- 📊 **Advanced Analytics**: Detailed breakdowns, charts, and replay functionality
- 🔒 **Secure Local Storage**: API keys stored locally in the browser (IndexedDB); optional passphrase encryption via Web Crypto (AES-GCM)
- 💾 **No Database Required**: Works instantly with in-memory storage
- 📦 **Export & Share**: JSON, Markdown, and shareable summaries
- 🧭 **Custom Topics**: Presets plus your own topics
- 🎭 **Demo Mode**: Test the platform without API keys
- 🧑‍⚖️ **Solo Panel Mode**: Individual participant leaderboards

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/ranandha/debateclubai.git
cd debateclubai  # or whatever you named the folder (e.g., DebateAI)

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ⚙️ Configuration

### 1. Configure API Keys

1. Click **Settings** in the navigation
2. Enter your API keys for any providers you want to use:
   - **OpenAI**: Get key from [platform.openai.com](https://platform.openai.com)
   - **Google Gemini**: Get key from [makersuite.google.com](https://makersuite.google.com)
   - **Mistral AI**: Get key from [console.mistral.ai](https://console.mistral.ai)
   - **xAI**: Get key from [x.ai](https://x.ai)
   - **DeepSeek**: Get key from [platform.deepseek.com](https://platform.deepseek.com)
3. Optionally enable encryption with a passphrase
4. Test each provider connection
5. Click "Save Settings"

**Security Note**: API keys are stored locally in your browser's IndexedDB. An optional passphrase encrypts them using Web Crypto (AES-GCM). When you start a debate, your local Next.js server routes use these keys to call the AI providers — keys never leave your machine, are never committed to git, and there is no external database. ⚠️ Do not deploy this app publicly without adding authentication and moving API keys to secure server-side environment variables.

### 2. Run a Debate

1. Click **Start a Debate** from the landing page or dashboard
2. Select a topic from 10 pre-configured options or add a custom topic
3. Choose debate format (Classic, Fast, or Freeform)
4. Pick a mode: **Team Debate** or **Solo Panel**
5. Add participants and configure provider, model, and role style
6. Select judge provider and model
7. Click **Start Debate**

### 3. Demo Mode

Don't have API keys? No problem!

- The app automatically enables **Demo Mode** when no keys are configured
- You can also click **Launch Demo Mode** on the landing page or setup
- Uses mock responses and heuristic judge scoring
- Perfect for testing the UI and understanding debate flow

## 🧩 Supported Providers & Model Notes

- **OpenAI**: Use `gpt-4o` or `gpt-4o-mini` for best latency/quality balance
- **Gemini**: `gemini-2.0-flash-lite` is fast; `gemini-1.5-pro` for depth
- **Mistral**: `mistral-large-latest` for quality, `mistral-small-latest` for speed
- **xAI**: `grok-3-beta` or `grok-2-latest` depending on availability
- **DeepSeek**: `deepseek-chat` for debate, `deepseek-coder` for technical topics

## 🏗️ Architecture

### Storage

- **In-Memory**: Works immediately, no setup required. Data resets on page refresh. Perfect for testing and demos.

## 📤 Export & Share

### Export a Debate
1. During or after a debate, click **Export JSON** to download session data
2. Click **Export Markdown** for a readable transcript with scores

### Share a Summary
1. Click **Copy Summary** in the live debate room or results page
2. Paste the shareable text into email, Slack, or documents

## 🎯 Debate Flow

### Phases (Classic Format - 10 minutes)

1. **Opening Arguments** (2 min): Initial positions
2. **Rebuttals** (4 min): Counter-arguments and responses
3. **Cross-Examination** (2 min): Direct questioning
4. **Closing Statements** (2 min): Final arguments

### Scoring System

Each message is scored 0-10 by an AI judge (or heuristic in demo mode):
- **Argument Quality** (0-4): Strength and validity of reasoning
- **Relevance** (0-2): Topic and phase alignment
- **Evidence** (0-2): Quality of examples and citations
- **Clarity** (0-2): Structure and conciseness

**Points**: Each participant earns points equal to their message score (0-10) for each contribution.

**Winner Determination**:
- **Team Mode**: Team A vs Team B—team with highest total points wins
- **Solo Panel Mode**: Individual leaderboard—participant with most points wins
- **Demo Mode**: Uses heuristic scoring (keyword matching, structure analysis) when no API keys configured

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS + shadcn/ui
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts
- **Storage**: IndexedDB (idb-keyval)
- **Encryption**: Web Crypto API (AES-GCM, optional)

## 📁 Project Structure

```
debateclubai/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Landing page
│   ├── settings/          # API key configuration
│   ├── app/               # Main application
│   │   ├── page.tsx       # Dashboard
│   │   └── debates/       # Debate flows
│   └── api/               # API routes
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Core logic
│   ├── providers/        # AI provider adapters
│   ├── storage/          # Storage adapters
│   ├── constants.ts      # App constants
│   └── utils.ts          # Utility functions
├── types/                 # TypeScript definitions
└── public/               # Static assets
```

## 🔐 Security & Privacy

- ✅ **API keys stored locally**: Saved in your browser's IndexedDB, not on any remote server
- ✅ **Optional encryption**: Passphrase-based encryption via Web Crypto (AES-GCM)
- ✅ **Server-side calls only**: Your local Next.js server uses keys to call AI providers—keys never leave your machine
- ✅ **No external database**: Zero risk of credential leaks from database breaches
- ✅ **Never committed**: `.gitignore` prevents accidental key commits
- ⚠️ **Shared machines**: Avoid using on public/shared computers without clearing browser data
- ⚠️ **Public deployments**: Add authentication before deploying to public URLs

## 🧰 Troubleshooting

### App won’t start
```bash
rm -rf node_modules
pnpm install
pnpm dev
```

### API key not working
- Verify the key has the right permissions
- Ensure the provider and model match the key’s account
- Use **Settings → Test Connection** to validate

### Debates not persisting
- In-memory storage resets on refresh
- Export JSON/Markdown for backups

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm i -g vercel

# Deploy
vercel
```

### Other Platforms

Works on any platform that supports Next.js:
- Netlify
- Railway
- Render
- Self-hosted

**Important**: Uses in-memory storage, so each deployment starts fresh. Export debates as JSON/Markdown for backups.

## 📝 Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript compiler check
```

## 🤝 Contributing

This is a public repository. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📜 License

MIT License - see LICENSE file for details

## 🙏 Attribution

### Images & Assets

See [ATTRIBUTION.md](./ATTRIBUTION.md) for photo and asset sources.

### Libraries

Built with amazing open-source projects:
- [Next.js](https://nextjs.org)
- [shadcn/ui](https://ui.shadcn.com)
- [Framer Motion](https://www.framer.com/motion/)
- [Recharts](https://recharts.org)

## 📞 Support

- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions

---

**Built with ❤️ by the DebateClubAI team**
"Graphite Test"