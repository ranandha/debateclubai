# Quick Start Guide - DebateClubAI v2

## 🚀 Getting Started in 3 Minutes

### Step 1: Installation (1 minute)

```bash
# Navigate to project directory
cd DebateAI

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open http://localhost:3000

### Step 2: Try Demo Mode (30 seconds)

1. Click **"Launch Demo Mode"** on the landing page
2. Select a topic (e.g., "AI will create more jobs than it destroys")
3. Choose **Team Debate** or **Solo Panel**
4. Click **"Add Participant"** (adds one AI)
5. Click **"Start Debate"**
6. Watch the debate unfold with mock responses!

### Step 3: Configure Real API Keys (1 minute)

1. Click **"Settings"** in the navigation
2. Enter your OpenAI API key (or any other provider)
3. Select your default model
4. Click **"Test Connection"** to verify
5. Click **"Save Settings"**

### Step 4: Run a Real Debate (30 seconds)

1. Go back to **"New Debate"**
2. Configure participants as desired
3. Click **"Start Debate"**
4. Watch AI agents debate in real-time!

## 🎯 Key Features to Try

### Custom Debate Setup
- **Topics**: Choose from 10 pre-configured topics or add a custom topic
- **Formats**: Classic (10 min), Fast (5 min), Freeform (15 min)
- **Modes**: Team Debate or Solo Panel
- **Teams/Panel**: Add participants as teams or solo panelists
- **Providers**: Mix OpenAI, Gemini, Mistral, xAI, DeepSeek
- **Roles**: Aggressive, Analytical, Diplomatic, Passionate

### Live Debate Room
- **Real-time scoring**: Each message scored 0-10
- **Phase transitions**: Opening → Rebuttals → Cross-exam → Closing
- **Auto-orchestration**: AI agents raise hands and take turns
- **Progress tracking**: Live scoreboard with points and stats

### Results & Analytics
- **Winner announcement**: Team or top solo participant
- **Performance charts**: Visual breakdown by participant
- **Top messages**: Best 3 messages with judge rationale
- **Export debate**: Download JSON or Markdown
- **Share summary**: Copy a quick shareable recap

## 🔐 Security Notes

- API keys stored in browser IndexedDB (never on server)
- Optional AES-256 encryption with passphrase
- Keys never logged, committed, or transmitted
- Safe for public repositories

## 🎭 Demo Mode Features

Without API keys, you get:
- ✅ Full UI and debate flow
- ✅ Mock AI responses (realistic templates)
- ✅ Heuristic judge scoring (keyword-based)
- ✅ All features except real AI calls

Perfect for:
- Testing the platform
- Understanding debate flow
- UI/UX exploration
- Demos and presentations

## 📊 Understanding Scores

### Message Scoring (0-10)
- **Argument Quality** (0-4): Logic and reasoning strength
- **Relevance** (0-2): Topic and phase alignment
- **Evidence** (0-2): Quality of examples/citations
- **Clarity** (0-2): Structure and readability

### Point System
- Each message = 10 base points + floor(score)
- Example: Score of 8.5 = 10 + 8 = 18 points
- Team score = sum of all participant points

### Winning
- **Standard**: Highest score at debate end
- **Early Win**: First to 100 points (optional toggle)

## 🛠️ Troubleshooting

### App won't start
```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install
pnpm dev
```

### API key not working
- Check that key has proper permissions
- Verify correct provider selected
- Use "Test Connection" to diagnose
- Check browser console for errors

### Debates not persisting
- Default: In-memory storage (resets on refresh)
- Enable file storage: `NEXT_PUBLIC_USE_FILE_STORE=true` in `.env.local`
- Or use Export (JSON/Markdown) to save debates

### Styling issues
```bash
# Rebuild Tailwind
pnpm build
pnpm dev
```

## 🎨 Customization Ideas

### Add More Topics
Edit `lib/constants.ts` → `DEBATE_TOPICS` array

### Change Scoring Rubric
Edit `lib/providers/judge.ts` → `scoreWithHeuristic` function

### Adjust Phase Durations
Edit `lib/constants.ts` → `PHASE_DURATIONS` object

### Customize Colors/Theme
Edit `tailwind.config.ts` and `app/globals.css`

## 📚 Next Steps

1. ✅ Complete this quick start
2. 📖 Read the full [README.md](./README.md)
3. 🔍 Explore the codebase structure
4. 🎨 Customize to your needs
5. 🚀 Deploy to Vercel or your platform of choice

## 💡 Pro Tips

- **Multiple Providers**: Mix different AI providers in one debate for variety
- **Role Styles**: Assign different styles to create dynamic interactions
- **Temperature**: Lower = more focused, Higher = more creative
- **Judge Model**: Use a stronger model (e.g., GPT-4) for better scoring
- **Export Often**: Save interesting debates before they're lost

---

**Need help?** Open an issue on GitHub or check the full documentation.

Happy Debating! 🎉
