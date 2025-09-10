/**
 * Claude Project Conversations Exporter
 * 
 * This script exports ALL conversations from a Claude Project (not just a single conversation).
 * It extracts project ID and organization ID, fetches all conversations in the project,
 * downloads each conversation's data, converts to Markdown format, and saves as multiple
 * files or a combined file.
 * 
 * Usage: Paste this entire script into the browser console while on a Claude project page.
 * Project page URL format: https://claude.ai/project/[PROJECT-UUID]
 */

// ========= PROJECT ID EXTRACTION =========
function getProjectId() {
    const urlPath = window.location.pathname;
    const matches = urlPath.match(/\/project\/([a-f0-9-]{36})/);
    
    if (!matches || !matches[1]) {
        console.error('❌ Not on a project page. URL must be like: https://claude.ai/project/[uuid]');
        showNotification('Please navigate to a Claude Project page first!', 'error');
        return null;
    }
    
    // Validate UUID format
    const projectId = matches[1];
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(projectId)) {
        console.error('❌ Invalid project ID format');
        return null;
    }
    
    console.log('✅ Project ID:', projectId);
    return projectId;
}

// ========= ORGANIZATION ID EXTRACTION =========
// Method 0: Check cookies for lastActiveOrg (MOST RELIABLE FOR PROJECTS)
function getOrgIdFromCookies() {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'lastActiveOrg') {
            console.log('✅ Found organizationID in lastActiveOrg cookie:', value);
            return value;
        }
    }
    return null;
}

function getOrganizationId() {
    // Try cookie first (most reliable for projects)
    const cookieOrgId = getOrgIdFromCookies();
    if (cookieOrgId) return cookieOrgId;
    
    // Fall back to comprehensive extraction
    return extractClaudeOrgID();
}

// Advanced organizationID extraction script (reused from existing code)
function extractClaudeOrgID() {
    console.log("🔍 Starting advanced organizationID extraction...");

    // Get project ID from URL for reference
    const projectId = window.location.pathname.match(/\/project\/([a-f0-9-]+)/)?.[1];
    console.log(`📝 Current project ID: ${projectId}`);

    // ========= Method 1: Check localStorage =========
    console.log("Method 1: Checking localStorage...");
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        try {
            const value = localStorage.getItem(key);
            if (value && value.includes("organizationID")) {
                console.log(`Found potential match in localStorage key: ${key}`);

                try {
                    const parsed = JSON.parse(value);
                    const orgId = extractOrgIdFromObject(parsed);
                    if (orgId) {
                        console.log(`✅ Found organizationID in localStorage: ${orgId}`);
                        return orgId;
                    }
                } catch (e) {
                    // Not valid JSON or doesn't contain the ID
                }
            }
        } catch (e) {
            // Skip inaccessible localStorage items
        }
    }

    // ========= Method 2: Check sessionStorage =========
    console.log("Method 2: Checking sessionStorage...");
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        try {
            const value = sessionStorage.getItem(key);
            if (value && value.includes("organizationID")) {
                console.log(`Found potential match in sessionStorage key: ${key}`);

                try {
                    const parsed = JSON.parse(value);
                    const orgId = extractOrgIdFromObject(parsed);
                    if (orgId) {
                        console.log(`✅ Found organizationID in sessionStorage: ${orgId}`);
                        return orgId;
                    }
                } catch (e) {
                    // Not valid JSON or doesn't contain the ID
                }
            }
        } catch (e) {
            // Skip inaccessible sessionStorage items
        }
    }

    // ========= Method 3: Check global variables =========
    console.log("Method 3: Checking global window variables...");

    const potentialPaths = [
        "window.__NEXT_DATA__.props.pageProps.organization.uuid",
        "window.__NEXT_DATA__.props.pageProps.organization.id",
        "window.__NEXT_DATA__.props.pageProps.organizationID",
        "window.__PRELOADED_STATE__.organization.uuid",
        "window.__PRELOADED_STATE__.organization.id",
        "window.app.organization.uuid",
        "window.app.organization.id",
        "window.app.user.organization.uuid"
    ];

    for (const path of potentialPaths) {
        try {
            const value = eval(path);
            if (value && /^[a-f0-9-]{36}$/.test(value)) {
                console.log(`✅ Found organizationID in ${path}: ${value}`);
                return value;
            }
        } catch (e) {
            // Path doesn't exist, continue to next
        }
    }

    // ========= Method 4: Check cookies (beyond lastActiveOrg) =========
    console.log("Method 4: Checking other cookies...");
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (value && value.length > 30 && /[a-f0-9-]{30,}/.test(value)) {
            console.log(`Potential organizationID in cookie ${name}: ${value}`);
            if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value)) {
                console.log(`✅ Found likely organizationID in cookie: ${value}`);
                return value;
            }
        }
    }

    // If all else fails, prompt the user
    console.log("❌ Couldn't automatically find the organizationID.");
    const userInput = prompt('Could not automatically detect your organization ID. Please enter it manually:', '');
    return userInput || null;
}

// Helper function to extract organization ID from an object
function extractOrgIdFromObject(obj, depth = 0, maxDepth = 5) {
    if (depth > maxDepth || !obj || typeof obj !== 'object') {
        return null;
    }

    // Case 1: Direct organizationID property
    if (obj.organizationID && typeof obj.organizationID === 'string' && 
        /^[a-f0-9-]{36}$/.test(obj.organizationID)) {
        return obj.organizationID;
    }

    // Case 2: In customIDs object
    if (obj.customIDs && obj.customIDs.organizationID && 
        /^[a-f0-9-]{36}$/.test(obj.customIDs.organizationID)) {
        return obj.customIDs.organizationID;
    }

    // Case 3: In organization object
    if (obj.organization && obj.organization.uuid && 
        /^[a-f0-9-]{36}$/.test(obj.organization.uuid)) {
        return obj.organization.uuid;
    }

    if (obj.organization && obj.organization.id && 
        /^[a-f0-9-]{36}$/.test(obj.organization.id)) {
        return obj.organization.id;
    }

    // Recursive search
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && 
            typeof obj[key] === 'object' && obj[key] !== null) {

            const result = extractOrgIdFromObject(obj[key], depth + 1, maxDepth);
            if (result) {
                return result;
            }
        }
    }

    return null;
}

// ========= CONVERSATIONS LIST FETCHING =========
function buildConversationsListUrl(orgId, projectId, limit = 1000, offset = 0) {
    return `https://claude.ai/api/organizations/${orgId}/projects/${projectId}/conversations_v2?limit=${limit}&offset=${offset}`;
}

async function fetchConversationsList(orgId, projectId) {
    const url = buildConversationsListUrl(orgId, projectId);
    console.log('📋 Fetching conversations list from:', url);
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include', // CRITICAL: Include cookies for auth
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Authentication failed. Please log in to Claude and try again.');
            } else if (response.status === 403) {
                throw new Error('Access denied. Make sure you have access to this project.');
            } else if (response.status === 404) {
                throw new Error('Project not found. Check the project ID.');
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // The API returns { data: [...] } not { conversations: [...] }
        if (data.data && Array.isArray(data.data)) {
            console.log(`✅ Found ${data.data.length} conversations`);
            return data.data;
        } else if (Array.isArray(data)) {
            // Fallback for direct array response
            console.log(`✅ Found ${data.length} conversations`);
            return data;
        } else {
            console.error('⚠️ Unexpected response structure:', data);
            throw new Error('Invalid response structure - expected data.data array');
        }
        
    } catch (error) {
        console.error('❌ Failed to fetch conversations list:', error);
        throw error;
    }
}

// ========= INDIVIDUAL CONVERSATION FETCHING =========
async function fetchConversation(orgId, conversationId, retries = 3) {
    const url = `https://claude.ai/api/organizations/${orgId}/chat_conversations/${conversationId}?tree=True&rendering_mode=messages&render_all_tools=true`;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.status === 429) {
                // Rate limited - wait and retry
                const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
                console.log(`⏳ Rate limited. Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            if (attempt === retries) {
                console.error(`❌ Failed to fetch conversation ${conversationId} after ${retries} attempts`);
                return null; // Return null for failed conversations
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

async function fetchAllConversations(orgId, conversationsList, batchSize = 5) {
    const conversations = [];
    const total = conversationsList.length;
    
    // Show progress
    showNotification(`Starting export of ${total} conversations...`, 'info');
    
    // Use memory-efficient processing for large projects
    if (total > 100) {
        return await processLargeProject(orgId, conversationsList, batchSize);
    }
    
    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < total; i += batchSize) {
        const batch = conversationsList.slice(i, Math.min(i + batchSize, total));
        
        console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(total/batchSize)}`);
        
        const batchPromises = batch.map(conv => 
            fetchConversation(orgId, conv.uuid)
                .then(data => ({
                    metadata: conv,
                    data: data
                }))
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        for (const result of batchResults) {
            if (result.status === 'fulfilled' && result.value.data) {
                conversations.push(result.value);
            } else {
                console.warn('⚠️ Skipped failed conversation');
            }
        }
        
        // Update progress
        const progress = Math.min(i + batchSize, total);
        showNotification(`Fetched ${progress}/${total} conversations...`, 'info');
        
        // Rate limit between batches - adaptive based on project size
        if (i + batchSize < total) {
            const delay = total > 50 ? 750 : 500; // Slightly longer delay for medium projects
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    console.log(`✅ Successfully fetched ${conversations.length}/${total} conversations`);
    return conversations;
}

// Memory-efficient processing for large projects - now returns all conversations
async function processLargeProject(orgId, conversationsList, batchSize = 5) {
    console.log('🔄 Processing large project with memory-efficient approach...');
    
    const total = conversationsList.length;
    const chunkSize = 50; // Process in chunks of 50 for memory efficiency
    let allConversations = [];
    let processedCount = 0;
    
    // Process conversations in chunks to manage memory
    for (let i = 0; i < total; i += chunkSize) {
        const chunk = conversationsList.slice(i, Math.min(i + chunkSize, total));
        console.log(`🗂️ Processing chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(total / chunkSize)} (${chunk.length} conversations)`);
        
        // Process chunk in batches
        for (let j = 0; j < chunk.length; j += batchSize) {
            const batch = chunk.slice(j, Math.min(j + batchSize, chunk.length));
            
            const batchPromises = batch.map(conv => 
                fetchConversation(orgId, conv.uuid)
                    .then(data => ({
                        metadata: conv,
                        data: data
                    }))
            );
            
            const batchResults = await Promise.allSettled(batchPromises);
            
            for (const result of batchResults) {
                if (result.status === 'fulfilled' && result.value.data) {
                    allConversations.push(result.value);
                } else {
                    console.warn('⚠️ Skipped failed conversation');
                }
            }
            
            processedCount += batch.length;
            
            // Update progress
            showNotification(`Processing: ${processedCount}/${total} conversations...`, 'info');
            
            // Rate limit between batches - increase delay for larger projects
            const delay = total > 200 ? 1000 : 500;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Garbage collection hint for memory management
        if (typeof global !== 'undefined' && global.gc) {
            global.gc();
        }
    }
    
    console.log(`✅ Successfully processed ${allConversations.length}/${total} conversations`);
    return allConversations;
}

// DEPRECATED: These functions are no longer used as we always generate individual files
// Keeping them commented for reference only

/*
function createChunkMarkdown(conversations, chunkNumber) {
    // No longer used - we always create individual files
    let markdown = `# Claude Project Export - Chunk ${chunkNumber}\n\n`;
    markdown += `*Export Date: ${new Date().toLocaleString()}*\n`;
    markdown += `*Conversations in this chunk: ${conversations.length}*\n\n`;
    markdown += `---\n\n`;
    
    conversations.forEach(conv => {
        markdown += convertToMarkdown(conv);
        markdown += `\n\n${'='.repeat(80)}\n\n`;
    });
    
    return markdown;
}

function createLargeProjectIndex(conversationsList, totalChunks) {
    // No longer used - we always create a single index.md with links to individual files
    let markdown = `# Claude Project Export - Large Project Index\n\n`;
    markdown += `*Export Date: ${new Date().toLocaleString()}*\n`;
    markdown += `*Total Conversations: ${conversationsList.length}*\n`;
    markdown += `*Total Chunks: ${totalChunks}*\n\n`;
    markdown += `---\n\n`;
    markdown += `## Files in this export:\n\n`;
    
    for (let i = 1; i <= totalChunks; i++) {
        const chunkFile = `claude_project_chunk_${i.toString().padStart(2, '0')}.md`;
        markdown += `- [${chunkFile}](./${chunkFile})\n`;
    }
    
    markdown += `\n---\n\n`;
    markdown += `## All Conversations:\n\n`;
    
    // Sort by updated date (most recent first)
    const sorted = conversationsList.sort((a, b) => 
        new Date(b.updated_at) - new Date(a.updated_at)
    );
    
    sorted.forEach((conv, index) => {
        const chunkNumber = Math.floor(index / 50) + 1;
        const chunkFile = `claude_project_chunk_${chunkNumber.toString().padStart(2, '0')}.md`;
        
        markdown += `${index + 1}. **${conv.name}** (in [${chunkFile}](./${chunkFile}))\n`;
        markdown += `   - Created: ${new Date(conv.created_at).toLocaleDateString()}\n`;
        markdown += `   - Updated: ${new Date(conv.updated_at).toLocaleDateString()}\n`;
        markdown += `   - Model: ${conv.model}\n\n`;
    });
    
    return markdown;
}
*/

// ========= MARKDOWN CONVERSION =========
function convertToMarkdown(conversation) {
    const { metadata, data } = conversation;
    
    if (!data || !data.chat_messages) {
        return `# ${metadata.name}\n\n*Failed to load conversation data*\n\n---\n\n`;
    }
    
    let markdown = `# ${data.name || metadata.name}\n\n`;
    
    if (data.summary) {
        markdown += `## Summary\n${data.summary}\n\n`;
    }
    
    markdown += `*Created: ${new Date(data.created_at || metadata.created_at).toLocaleString()}*\n`;
    markdown += `*Updated: ${new Date(data.updated_at || metadata.updated_at).toLocaleString()}*\n`;
    markdown += `*Model: ${metadata.model}*\n\n`;
    markdown += `---\n\n`;
    
    // Process messages (reuse existing logic from claude_export_script.js)
    data.chat_messages.forEach(message => {
        const sender = message.sender === 'human' ? '👤 **Human**' : '🤖 **Claude**';
        markdown += `## ${sender}\n\n`;
        
        // Process content
        if (message.content && message.content.length > 0) {
            message.content.forEach(content => {
                if (content.type === 'thinking' && content.thinking) {
                    const thinkingText = content.thinking.includes('characters truncated')
                        ? '**Note:** Full thinking content is truncated in the export.\n\n'
                        : content.thinking;
                    markdown += `**Thinking:**\n\`\`\`\n${thinkingText}\n\`\`\`\n\n`;
                } else if (content.type === 'text' && content.text) {
                    markdown += `${content.text}\n\n`;
                } else if (content.type === 'tool_use' && content.input) {
                    markdown += `**Tool Use:**\n\`\`\`json\n${JSON.stringify(content.input, null, 2)}\n\`\`\`\n\n`;
                } else if (content.type === 'tool_result' && content.content) {
                    markdown += `**Tool Result:**\n\`\`\`\n`;
                    if (Array.isArray(content.content)) {
                        content.content.forEach(item => {
                            if (item.type === 'text') markdown += item.text;
                        });
                    } else {
                        markdown += JSON.stringify(content.content, null, 2);
                    }
                    markdown += `\n\`\`\`\n\n`;
                }
            });
        }
        
        // Process attachments
        if (message.attachments && message.attachments.length > 0) {
            markdown += `### Attachments:\n`;
            message.attachments.forEach(attachment => {
                markdown += `- **${attachment.file_name || 'Attachment'}** (${attachment.file_type || 'file'})\n`;
                if (attachment.extracted_content && !attachment.extracted_content.includes('truncated')) {
                    markdown += `  \`\`\`\n${attachment.extracted_content.substring(0, 500)}...\n  \`\`\`\n`;
                }
            });
            markdown += `\n`;
        }
        
        markdown += `*${new Date(message.created_at).toLocaleString()}*\n\n`;
        markdown += `---\n\n`;
    });
    
    return markdown;
}

function createIndexMarkdown(projectId, conversations) {
    let markdown = `# Claude Project Export\n\n`;
    markdown += `*Project ID: ${projectId}*\n`;
    markdown += `*Export Date: ${new Date().toLocaleString()}*\n`;
    markdown += `*Total Conversations: ${conversations.length}*\n\n`;
    markdown += `---\n\n`;
    markdown += `## Conversations\n\n`;
    
    // Sort by updated date (most recent first)
    const sorted = conversations.sort((a, b) => 
        new Date(b.metadata.updated_at) - new Date(a.metadata.updated_at)
    );
    
    sorted.forEach((conv, index) => {
        // Include UUID suffix in filename for uniqueness
        const uuid = conv.metadata.uuid || conv.data?.uuid || '';
        const uuidSuffix = uuid ? `_${uuid.substring(0, 8)}` : '';
        const filename = `${sanitizeFilename(conv.metadata.name)}${uuidSuffix}`;
        markdown += `${index + 1}. [${conv.metadata.name}](./${filename}.md)\n`;
        markdown += `   - Created: ${new Date(conv.metadata.created_at).toLocaleDateString()}\n`;
        markdown += `   - Updated: ${new Date(conv.metadata.updated_at).toLocaleDateString()}\n`;
        markdown += `   - Model: ${conv.metadata.model}\n\n`;
    });
    
    return markdown;
}

// ========= UTILITY FUNCTIONS =========
function sanitizeFilename(filename) {
    if (!filename) return 'untitled_conversation';
    
    return filename
        .replace(/[<>:"/\\|?*]/g, '_')  // Replace invalid chars
        .replace(/\s+/g, '_')            // Replace spaces
        .replace(/_{2,}/g, '_')          // Collapse multiple underscores
        .replace(/^_|_$/g, '')           // Trim underscores
        .substring(0, 100)               // Limit length
        || 'untitled_conversation';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 350px;
        word-wrap: break-word;
        transition: all 0.3s ease;
    `;
    
    if (type === 'info') {
        notification.style.backgroundColor = '#3498db';
    } else if (type === 'success') {
        notification.style.backgroundColor = '#27ae60';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#e74c3c';
    }
    
    notification.innerHTML = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 4000);
}

// ========= DOWNLOAD FUNCTIONS =========
function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadIndividualFiles(conversations, projectId) {
    // Create index file first
    const indexMarkdown = createIndexMarkdown(projectId, conversations);
    downloadFile('index.md', indexMarkdown, 'text/markdown');
    
    // Process downloads in batches for better performance
    const batchSize = 10; // Download 10 files at a time
    const total = conversations.length;
    
    for (let i = 0; i < total; i += batchSize) {
        const batch = conversations.slice(i, Math.min(i + batchSize, total));
        
        // Download files in current batch
        batch.forEach((conv, batchIndex) => {
            setTimeout(() => {
                const markdown = convertToMarkdown(conv);
                // Add UUID suffix to prevent filename collisions
                const uuid = conv.metadata.uuid || conv.data?.uuid || '';
                const uuidSuffix = uuid ? `_${uuid.substring(0, 8)}` : '';
                const filename = `${sanitizeFilename(conv.metadata.name)}${uuidSuffix}.md`;
                downloadFile(filename, markdown, 'text/markdown');
            }, batchIndex * 100); // 100ms delay within batch
        });
        
        // Update progress
        const progress = Math.min(i + batchSize, total);
        console.log(`📥 Downloaded ${progress}/${total} conversation files`);
        
        // Wait before processing next batch (longer wait for larger projects)
        if (i + batchSize < total) {
            const batchDelay = total > 100 ? 2000 : 1000; // 2s for large projects, 1s for smaller
            await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
    }
    
    console.log(`✅ All ${total} conversation files downloaded successfully`);
}

// DEPRECATED: Combined file download is no longer used
// We always generate individual files for better organization and performance
/*
function downloadCombinedFile(conversations, projectId) {
    // No longer used - we always create individual files
    let combinedMarkdown = createIndexMarkdown(projectId, conversations);
    combinedMarkdown += `\n\n---\n\n# All Conversations\n\n`;
    
    conversations.forEach(conv => {
        combinedMarkdown += convertToMarkdown(conv);
        combinedMarkdown += `\n\n${'='.repeat(80)}\n\n`;
    });
    
    const filename = `claude_project_${projectId.substring(0, 8)}_export.md`;
    downloadFile(filename, combinedMarkdown, 'text/markdown');
}
*/

// ========= MAIN EXECUTION FUNCTION =========
async function exportProjectConversations() {
    console.log('🚀 Starting Claude Project Export...');
    
    try {
        // Step 1: Get IDs
        const projectId = getProjectId();
        if (!projectId) {
            throw new Error('Could not extract project ID. Make sure you are on a project page.');
        }
        
        const orgId = getOrganizationId();
        if (!orgId) {
            throw new Error('Could not extract organization ID. Please try refreshing the page.');
        }
        
        console.log('📋 Project ID:', projectId);
        console.log('🏢 Organization ID:', orgId);
        
        // Step 2: Fetch conversations list
        showNotification('Fetching conversations list...', 'info');
        const conversationsList = await fetchConversationsList(orgId, projectId);
        
        if (!conversationsList || conversationsList.length === 0) {
            showNotification('No conversations found in this project', 'error');
            return;
        }
        
        // Step 3: Fetch all conversations
        const conversations = await fetchAllConversations(orgId, conversationsList);
        
        if (conversations.length === 0) {
            showNotification('Failed to fetch any conversations', 'error');
            return;
        }
        
        // Step 4: Download files - Always generate individual files
        if (conversations.length === 0 && conversationsList.length > 200) {
            // Large project was already downloaded - this shouldn't happen with new logic
            return;
        }
        
        showNotification(`Downloading ${conversations.length} conversations...`, 'info');
        
        // Always use individual file generation regardless of count
        await downloadIndividualFiles(conversations, projectId);
        showNotification(`✅ Exported ${conversations.length} conversations as individual files!`, 'success');
        
    } catch (error) {
        console.error('❌ Export failed:', error);
        showNotification(`Export failed: ${error.message}`, 'error');
    }
}

// ========= EXECUTE THE EXPORT =========
exportProjectConversations();