// ==UserScript==
// @name         Claude Project Conversations Exporter
// @namespace    https://github.com/withLinda/claude-project-conversations-exporter
// @version      1.0.0
// @description  Export ALL conversations from a Claude Project (not just individual conversations). Creates a floating button on project pages.
// @author       Linda
// @match        https://claude.ai/project/*
// @grant        none
// @homepageURL  https://github.com/withLinda/claude-project-conversations-exporter
// @supportURL   https://github.com/withLinda/claude-project-conversations-exporter/issues
// @downloadURL  https://raw.githubusercontent.com/withLinda/claude-project-conversations-exporter/main/claude_project_exporter.user.js
// @updateURL    https://raw.githubusercontent.com/withLinda/claude-project-conversations-exporter/main/claude_project_exporter.user.js
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Add floating export button to the page
    function createExportButton() {
        // Remove existing button if present
        const existingButton = document.getElementById('claude-project-export-btn');
        if (existingButton) {
            existingButton.remove();
        }

        const button = document.createElement('button');
        button.id = 'claude-project-export-btn';
        button.innerHTML = '📋 Export Project';
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            padding: 10px 20px;
            background: #4a90e2;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.background = '#357abd';
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = '#4a90e2';
            button.style.transform = 'translateY(0px)';
            button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        });

        button.addEventListener('click', exportProjectConversations);
        document.body.appendChild(button);
    }

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

        // ========= Method 3: Check global window variables =========
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
                // Path doesn't exist, continue
            }
        }

        // ========= Method 4: Check other cookies =========
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

        console.log("❌ Couldn't automatically find the organizationID.");
        const userInput = prompt('Could not automatically detect your organization ID. Please enter it manually:', '');
        return userInput || null;
    }

    // Helper function to extract org ID from nested objects
    function extractOrgIdFromObject(obj, depth = 0, maxDepth = 5) {
        if (depth > maxDepth || !obj || typeof obj !== 'object') {
            return null;
        }

        // Check for organizationID directly
        if (obj.organizationID && typeof obj.organizationID === 'string' && /^[a-f0-9-]{36}$/.test(obj.organizationID)) {
            return obj.organizationID;
        }

        // Check for custom IDs
        if (obj.customIDs && obj.customIDs.organizationID && /^[a-f0-9-]{36}$/.test(obj.customIDs.organizationID)) {
            return obj.customIDs.organizationID;
        }

        // Check for organization.uuid
        if (obj.organization && obj.organization.uuid && /^[a-f0-9-]{36}$/.test(obj.organization.uuid)) {
            return obj.organization.uuid;
        }

        // Check for organization.id
        if (obj.organization && obj.organization.id && /^[a-f0-9-]{36}$/.test(obj.organization.id)) {
            return obj.organization.id;
        }

        // Recursively search nested objects
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key) && typeof obj[key] === 'object' && obj[key] !== null) {
                const result = extractOrgIdFromObject(obj[key], depth + 1, maxDepth);
                if (result) {
                    return result;
                }
            }
        }

        return null;
    }

    // ========= API FUNCTIONS =========
    function buildConversationsListUrl(orgId, projectId, limit = 1000, offset = 0) {
        return `https://claude.ai/api/organizations/${orgId}/projects/${projectId}/conversations_v2?limit=${limit}&offset=${offset}`;
    }

    async function fetchConversationsList(orgId, projectId) {
        const url = buildConversationsListUrl(orgId, projectId);
        console.log('📋 Fetching conversations list from:', url);

        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
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

    async function fetchConversation(orgId, conversationId, retries = 3) {
        const url = `https://claude.ai/api/organizations/${orgId}/chat_conversations/${conversationId}?tree=True&rendering_mode=messages&render_all_tools=true`;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    credentials: 'include'
                });

                if (response.status === 429) {
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
                    return null;
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
        return null;
    }

    async function fetchAllConversations(orgId, conversationsList, batchSize = 5) {
        const conversations = [];
        const total = conversationsList.length;
        
        showNotification(`Starting export of ${total} conversations...`, 'info');

        // Use large project processing for > 100 conversations
        if (total > 100) {
            return await processLargeProject(orgId, conversationsList, batchSize);
        }

        for (let i = 0; i < total; i += batchSize) {
            const batch = conversationsList.slice(i, Math.min(i + batchSize, total));
            console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(total / batchSize)}`);

            const batchPromises = batch.map(conv => 
                fetchConversation(orgId, conv.uuid).then(data => ({
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

            const progress = Math.min(i + batchSize, total);
            showNotification(`Exported ${progress}/${total} conversations...`, 'info');

            if (i + batchSize < total) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log(`✅ Successfully fetched ${conversations.length}/${total} conversations`);
        return conversations;
    }

    async function processLargeProject(orgId, conversationsList, batchSize = 5) {
        console.log('🔄 Using streaming approach for large project...');
        const total = conversationsList.length;
        const chunkSize = 50;
        let allConversations = [];
        let chunkNumber = 1;

        for (let i = 0; i < total; i += chunkSize) {
            const chunk = conversationsList.slice(i, Math.min(i + chunkSize, total));
            console.log(`🗂️ Processing chunk ${chunkNumber}/${Math.ceil(total / chunkSize)} (${chunk.length} conversations)`);
            
            const chunkConversations = [];

            for (let j = 0; j < chunk.length; j += batchSize) {
                const batch = chunk.slice(j, Math.min(j + batchSize, chunk.length));
                const batchPromises = batch.map(conv => 
                    fetchConversation(orgId, conv.uuid).then(data => ({
                        metadata: conv,
                        data: data
                    }))
                );

                const batchResults = await Promise.allSettled(batchPromises);
                
                for (const result of batchResults) {
                    if (result.status === 'fulfilled' && result.value.data) {
                        chunkConversations.push(result.value);
                    } else {
                        console.warn('⚠️ Skipped failed conversation');
                    }
                }

                const progress = i + j + batch.length;
                showNotification(`Processing: ${progress}/${total} conversations...`, 'info');
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            if (total > 200) {
                // For very large projects, download chunks separately
                const chunkMarkdown = createChunkMarkdown(chunkConversations, chunkNumber);
                const filename = `claude_project_chunk_${chunkNumber.toString().padStart(2, '0')}.md`;
                downloadFile(filename, chunkMarkdown, 'text/markdown');
                console.log(`📁 Downloaded chunk ${chunkNumber}: ${filename}`);
                chunkConversations.length = 0; // Clear memory
            } else {
                allConversations.push(...chunkConversations);
            }

            chunkNumber++;

            // Force garbage collection if available
            if (typeof global !== 'undefined' && global.gc) {
                global.gc();
            }
        }

        if (total > 200) {
            const indexMarkdown = createLargeProjectIndex(conversationsList, Math.ceil(total / chunkSize));
            downloadFile('index.md', indexMarkdown, 'text/markdown');
            showNotification(`✅ Large project exported as ${Math.ceil(total / chunkSize)} chunk files + index!`, 'success');
            return [];
        }

        return allConversations;
    }

    // ========= MARKDOWN CONVERSION FUNCTIONS =========
    function createChunkMarkdown(conversations, chunkNumber) {
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
        const sorted = conversationsList.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
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

        data.chat_messages.forEach(message => {
            const sender = message.sender === 'human' ? '👤 **Human**' : '🤖 **Claude**';
            markdown += `## ${sender}\n\n`;

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

        const sorted = conversations.sort((a, b) => new Date(b.metadata.updated_at) - new Date(a.metadata.updated_at));
        sorted.forEach((conv, index) => {
            const filename = sanitizeFilename(conv.metadata.name);
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
            .replace(/[<>:"/\\|?*]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_|_$/g, '')
            .substring(0, 100) || 'untitled_conversation';
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
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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

    function downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function downloadIndividualFiles(conversations, projectId) {
        const indexMarkdown = createIndexMarkdown(projectId, conversations);
        downloadFile('index.md', indexMarkdown, 'text/markdown');

        conversations.forEach((conv, index) => {
            setTimeout(() => {
                const markdown = convertToMarkdown(conv);
                const filename = `${sanitizeFilename(conv.metadata.name)}.md`;
                downloadFile(filename, markdown, 'text/markdown');
            }, index * 200);
        });
    }

    function downloadCombinedFile(conversations, projectId) {
        let combinedMarkdown = createIndexMarkdown(projectId, conversations);
        combinedMarkdown += `\n\n---\n\n# All Conversations\n\n`;
        
        conversations.forEach(conv => {
            combinedMarkdown += convertToMarkdown(conv);
            combinedMarkdown += `\n\n${'='.repeat(80)}\n\n`;
        });

        const filename = `claude_project_${projectId.substring(0, 8)}_export.md`;
        downloadFile(filename, combinedMarkdown, 'text/markdown');
    }

    // ========= MAIN EXPORT FUNCTION =========
    async function exportProjectConversations() {
        console.log('🚀 Starting Claude Project Export...');
        
        try {
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

            showNotification('Fetching conversations list...', 'info');
            const conversationsList = await fetchConversationsList(orgId, projectId);

            if (!conversationsList || conversationsList.length === 0) {
                showNotification('No conversations found in this project', 'error');
                return;
            }

            const conversations = await fetchAllConversations(orgId, conversationsList);

            // Handle large projects that were processed in chunks
            if (conversations.length === 0 && conversationsList.length > 200) {
                return;
            }

            if (conversations.length === 0) {
                showNotification('Failed to fetch any conversations', 'error');
                return;
            }

            showNotification(`Downloading ${conversations.length} conversations...`, 'info');

            if (conversations.length <= 20) {
                downloadIndividualFiles(conversations, projectId);
                showNotification(`✅ Exported ${conversations.length} conversations as individual files!`, 'success');
            } else {
                downloadCombinedFile(conversations, projectId);
                showNotification(`✅ Exported ${conversations.length} conversations as combined file!`, 'success');
            }

        } catch (error) {
            console.error('❌ Export failed:', error);
            showNotification(`Export failed: ${error.message}`, 'error');
        }
    }

    // ========= INITIALIZATION =========
    function init() {
        // Only create button on project pages
        if (window.location.pathname.includes('/project/')) {
            createExportButton();

            // Re-create button if page changes (SPA navigation)
            let currentPath = window.location.pathname;
            setInterval(() => {
                if (window.location.pathname !== currentPath) {
                    currentPath = window.location.pathname;
                    if (window.location.pathname.includes('/project/')) {
                        setTimeout(createExportButton, 500); // Delay to let page load
                    }
                }
            }, 1000);
        }
    }

    // Start the script
    init();

})();