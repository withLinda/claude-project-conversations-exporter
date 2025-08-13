# Claude Project Conversations Exporter

## 🔗 Related Tools

- **[Claude Project Knowledge Exporter](https://github.com/withLinda/claude-project-knowledge-exporter)** - Export project knowledge documentations from Claude Projects  
- **[Claude Conversation Exporter](https://github.com/withLinda/claude-conversation-exporter)** - Export individual Claude conversations to Markdown
---

A comprehensive JavaScript tool that exports **ALL conversations** from a Claude Project (not just single conversations). This tool extracts project and organization IDs, fetches all conversations in a project, and converts them to well-formatted Markdown files.

> **⚠️ Important Update**: Bookmarklets no longer work due to Content Security Policy restrictions on modern websites like claude.ai. Use one of the methods below instead.

## 🚀 Quick Start

**📋 [Full Installation Guide with Screenshots →](https://withlinda.github.io/claude-project-conversations-exporter/)**

### Method 1: Browser Console (100% Reliable)

1. **Navigate to a Claude Project page**  
   URL format: `https://claude.ai/project/[PROJECT-UUID]`

2. **Open browser console**  
   - **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - **Firefox**: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)

3. **Copy and paste this code into the console:**
   ```javascript
   // Loading the latest version of Claude Project Exporter...
   var script = document.createElement('script');
   script.src = 'https://raw.githubusercontent.com/withLinda/claude-project-conversations-exporter/main/claude_project_export_script.js?v=' + Date.now();
   script.onerror = function() { console.error('❌ Failed to load script. Check connection.'); };
   script.onload = function() { console.log('✅ Script loaded successfully!'); };
   document.head.appendChild(script);
   ```

4. **Wait for the export to complete**  
   The tool will automatically detect your project and organization IDs, fetch all conversations, and download the files.

### Method 2: Tampermonkey (Best User Experience)

1. **Install Tampermonkey extension:**
   - [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2. **Install the userscript:**
   - Click: [**Install Claude Project Exporter**](https://raw.githubusercontent.com/withLinda/claude-project-conversations-exporter/main/claude_project_exporter.user.js)
   - Click "Install" in the Tampermonkey dialog

3. **Use the exporter:**
   - Navigate to any Claude project page
   - Click the "📋 Export Project" button that appears in the top-right corner

### 🎯 Method Comparison

| Method | Best For | Pros | Cons |
|--------|----------|------|------|
| **🖥️ Console** | Maximum compatibility | ✅ Works on ALL browsers<br>✅ No extensions needed<br>✅ Always latest version | ❌ Need to paste code each time<br>❌ More technical |
| **🔧 Tampermonkey** | Regular users | ✅ One-click export button<br>✅ Automatic updates<br>✅ No console needed | ❌ Requires extension install<br>❌ Limited browser support |

## 📋 Features

### ✅ **Complete Project Export**
- Exports ALL conversations in a Claude Project (not just individual ones)
- Automatically detects project and organization IDs from the current page
- Supports projects of any size (1 to 1000+ conversations)

### ✅ **Smart Memory Management**
- **Small projects** (≤20 conversations): Individual `.md` files + `index.md`
- **Medium projects** (21-100 conversations): Single combined `.md` file
- **Large projects** (101-200 conversations): Chunked processing with combined file
- **Very large projects** (>200 conversations): Automatic chunking into multiple files

### ✅ **Comprehensive Data Export**
- **Message content**: Human and Claude messages with timestamps
- **Thinking sections**: Claude's reasoning process (when available)
- **Tool usage**: Function calls and results
- **Attachments**: File information and extracted content
- **Metadata**: Creation dates, models used, conversation summaries

### ✅ **Robust Error Handling**
- Authentication validation
- Rate limiting with exponential backoff
- Network error recovery
- Partial failure handling (continues with successful conversations)
- Clear user notifications throughout the process

### ✅ **Progress Tracking**
- Real-time progress notifications
- Batch processing status updates
- Memory usage optimization for large projects
- Clear success/failure reporting

## 📁 Output Formats

### Small Projects (≤20 conversations)
```
index.md                    # Master index with links to all conversations
conversation_1.md          # Individual conversation files
conversation_2.md
...
```

### Medium Projects (21-100 conversations)
```
claude_project_[id]_export.md    # Single combined file with all conversations
```

### Large Projects (101-200 conversations)
```
claude_project_[id]_export.md    # Combined file (processed in memory-efficient chunks)
```

### Very Large Projects (>200 conversations)
```
index.md                         # Master index linking to all chunks
claude_project_chunk_01.md       # Chunk files (50 conversations each)
claude_project_chunk_02.md
claude_project_chunk_03.md
...
```

## 🔧 Technical Architecture

### ID Extraction
1. **Project ID**: Extracted from URL pattern `/project/[uuid]`
2. **Organization ID**: Multi-method extraction:
   - Primary: `lastActiveOrg` cookie (most reliable for projects)
   - Fallback: localStorage, sessionStorage, global variables, other cookies
   - Manual prompt if automatic detection fails

### API Integration
- **Conversations List**: `GET /api/organizations/[org]/projects/[project]/conversations_v2`
- **Individual Conversations**: `GET /api/organizations/[org]/chat_conversations/[conv]`
- **Authentication**: Uses existing browser session cookies
- **Rate Limiting**: Automatic backoff and retry logic

### Data Processing
- JSON to Markdown conversion
- Handles truncated content gracefully
- Preserves message structure and metadata
- Sanitizes filenames for cross-platform compatibility

## 🛡️ Security & Privacy

- **Client-side only**: No data sent to external servers
- **Uses existing authentication**: Leverages your logged-in Claude session
- **Local processing**: All conversion happens in your browser
- **No external dependencies**: Pure vanilla JavaScript

## 🔍 Troubleshooting

### ⚠️ Deprecated: Bookmarklets No Longer Work

**Why bookmarklets stopped working:**
- Content Security Policy (CSP) on claude.ai blocks external script loading
- Bookmarklets are limited to ~2KB, but our script is 17KB+
- Modern browsers increasingly restrict bookmarklet functionality for security

**Use the methods above instead** - they bypass all these restrictions and work reliably.

### Common Issues

#### ❌ "Not on a project page"
- **Solution**: Navigate to a Claude project URL: `https://claude.ai/project/[uuid]`
- **Note**: This tool is specifically for projects, not individual conversations

#### ❌ "Authentication failed"
- **Solution**: Make sure you're logged into Claude.ai in the same browser
- **Try**: Refresh the page and ensure you can access the project normally

#### ❌ "Organization ID not found"
- **Solution**: The tool will prompt for manual entry
- **How to find**: Check the Network tab in DevTools for requests containing `/organizations/[uuid]`

#### ❌ Downloads blocked by browser
- **Solution**: Allow multiple downloads when prompted by your browser
- **Chrome**: Click "Allow" when the download permission popup appears

### Rate Limiting
The tool includes built-in rate limiting to respect Claude's API:
- 500ms delay between batches
- Exponential backoff on 429 errors
- Automatic retry logic (up to 3 attempts per conversation)

### Memory Management
For large projects:
- Conversations are processed in batches of 5
- Memory is cleared between chunks
- Very large projects (>200 conversations) download incrementally

## 📊 Testing

The tool has been designed and tested for various scenarios:

- ✅ Empty projects (0 conversations)
- ✅ Small projects (1-5 conversations)
- ✅ Medium projects (20-50 conversations)  
- ✅ Large projects (100+ conversations)
- ✅ Authentication edge cases
- ✅ Network failure scenarios
- ✅ Rate limiting conditions
- ✅ Partial failure recovery

## 🔄 Differences from Single Conversation Exporter

| Feature | Single Conversation | Project Conversations |
|---------|-------------------|---------------------|
| **Scope** | One conversation | All conversations in project |
| **URL Pattern** | `/chat/[uuid]` | `/project/[uuid]` |
| **API Endpoint** | Direct conversation API | Project conversations list API |
| **Memory Handling** | Simple | Chunked for large projects |
| **Output** | 2 files (.md + .json) | Multiple files or chunked files |
| **Organization ID** | Multiple fallback methods | Cookie-first approach |

## 🚨 Important Notes

1. **Project Pages Only**: This tool only works on Claude project pages, not individual conversation pages
2. **Browser Support**: Works in Chrome, Firefox, Edge, and Safari (latest versions)
3. **File Downloads**: Your browser may prompt to allow multiple downloads
4. **Large Projects**: Projects with 1000+ conversations may take several minutes to process
5. **Memory Usage**: Very large projects are automatically chunked to prevent browser crashes

## 📚 Advanced Usage

### Custom Batch Sizes
You can modify the batch size by editing the script:
```javascript
// Change from default 5 to custom value
const conversations = await fetchAllConversations(orgId, conversationsList, 10);
```

### Manual Organization ID
If automatic detection fails, you'll be prompted to enter it manually. You can find it by:
1. Opening DevTools → Network tab
2. Look for requests to `/organizations/[uuid]`
3. Copy the UUID from the URL

## 🤝 Contributing

This is a standalone JavaScript tool designed for browser console execution. Key considerations:

- Pure vanilla JavaScript (no dependencies)
- Browser console environment
- No build process required
- Cross-browser compatibility
- Comprehensive error handling

## 📜 License

This tool is provided as-is for personal use. Please respect Claude AI's terms of service and rate limits.

---

**⭐ Pro Tip**: For the best experience, run the export on a stable internet connection and allow plenty of time for large projects (100+ conversations may take 10-15 minutes).