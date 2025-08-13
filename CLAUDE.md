# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Claude Project Conversations Exporter** - a comprehensive JavaScript tool that exports ALL conversations from a Claude Project (not just individual conversations). The tool runs entirely in the browser console without any dependencies or build process.

## Key Architecture Differences from Single Conversation Exporter

### Core Differences:
1. **Scope**: Exports entire projects (multiple conversations) vs single conversations
2. **URL Detection**: Detects `/project/[uuid]` URLs vs `/chat/[uuid]`  
3. **API Integration**: Uses project conversations list API + individual conversation APIs
4. **Memory Management**: Advanced chunking for large projects (100+ conversations)
5. **Output Formats**: Multiple file formats based on project size

### Key Files:
- `claude_project_export_script.js` - Main export script (paste into console)
- `claude_project_bookmarklet.js` - Bookmarklet version for easy access
- `bookmarklet.html` - User-friendly installation page
- `README.md` - Comprehensive documentation
- `CLAUDE.md` - This development context file

## Technical Architecture

### ID Extraction:
```javascript
// Project ID from URL: /project/[uuid]
function getProjectId() { /* extracts from window.location.pathname */ }

// Organization ID with cookie priority for projects
function getOrganizationId() { 
    // Primary: lastActiveOrg cookie (most reliable for projects)
    // Fallback: comprehensive extraction from localStorage/sessionStorage/globals
}
```

### API Flow:
1. **Conversations List**: `GET /api/organizations/[org]/projects/[project]/conversations_v2`
2. **Individual Conversations**: `GET /api/organizations/[org]/chat_conversations/[conv]` (batched)
3. **Rate Limiting**: Built-in exponential backoff and retry logic

### Memory Management Strategy:
- **≤20 conversations**: Individual files + index
- **21-100 conversations**: Single combined file  
- **101-200 conversations**: Chunked processing, single output
- **>200 conversations**: Multi-file chunks with master index

### Error Handling:
- Authentication validation (401/403 handling)
- Rate limiting recovery (429 with backoff)
- Network failure retry logic  
- Partial failure graceful degradation
- User-friendly error notifications

## Development Guidelines

### Code Standards
- Pure vanilla JavaScript - no frameworks or dependencies
- Browser console execution environment
- No build process or transpilation needed
- Comprehensive error handling and user feedback
- Memory-efficient processing for large datasets

### Testing Approach
The tool should be tested across these scenarios:
1. **Empty projects** (0 conversations) - should show appropriate message
2. **Small projects** (1-20 conversations) - individual files + index
3. **Medium projects** (21-100 conversations) - combined file
4. **Large projects** (101-200 conversations) - memory-efficient processing  
5. **Very large projects** (>200 conversations) - chunked files + master index
6. **Error scenarios**: auth failures, network issues, rate limiting, partial failures
7. **Browser compatibility**: Chrome, Firefox, Edge, Safari

### Authentication Requirements
- Must use `credentials: 'include'` in all fetch calls
- Validates organization ID extraction with cookie priority
- Handles 401/403 responses gracefully
- Provides clear guidance for authentication issues

### Performance Considerations
- Batch processing (default 5 conversations per batch)
- Rate limiting (500ms between batches)
- Memory management for large projects (chunked processing)
- Progressive downloading to prevent browser crashes
- Garbage collection hints for memory cleanup

## Common Development Tasks

### Adding New Features
When adding features, consider:
1. **Memory impact** for large projects
2. **Rate limiting** requirements
3. **Error handling** for all failure modes
4. **User feedback** with progress notifications
5. **Browser compatibility** across major browsers

### Debugging Issues
For troubleshooting:
1. **Console logs** are comprehensive with emoji prefixes
2. **Network tab** shows API calls for debugging
3. **Error notifications** provide user-friendly messages
4. **Fallback mechanisms** for ID extraction failures

### Testing New Changes
To test changes:
1. Navigate to a Claude project page
2. Open browser console (F12)
3. Paste the entire script content
4. Test with projects of different sizes
5. Verify error handling with invalid scenarios

## Security Considerations

### Data Privacy:
- Script runs entirely client-side with no external data transmission
- Uses browser's existing authentication (cookies/session)
- No external dependencies or CDN requirements
- All processing happens locally in the browser

### Input Validation:
- UUID format validation for all extracted IDs
- URL pattern validation before processing
- API response structure validation
- Filename sanitization for cross-platform compatibility

## 📝 CRITICAL: Detailed Commit Message Requirements

### MANDATORY: Comprehensive Commit Documentation
Every commit MUST include detailed technical documentation to prevent recurring issues and regressions.

#### Commit Message Structure (REQUIRED):
```
fix/feat/chore: Brief summary of the change

## 🔍 ROOT CAUSE ANALYSIS (REQUIRED for fixes)
### The Problem:
- Detailed description of the exact issue
- Technical root cause explanation  
- Why this occurred (environmental factors, API changes, etc.)

### Impact:
- What was broken or not working
- User experience impact
- System behavior before fix

## 🛠️ SOLUTION IMPLEMENTED (REQUIRED)
### Technical Changes:
- Specific code changes made
- API endpoint modifications
- Memory management improvements
- Before/after comparisons with code examples

### Why This Works:
- Technical explanation of the solution
- How it addresses the root cause
- Integration with existing error handling

## 🚨 PREVENTION MEASURES (REQUIRED for recurring issues)
### To Prevent Future Regression:
- Specific patterns to follow
- Memory management best practices
- API usage guidelines
- Testing requirements for similar changes

### Code Patterns to Remember:
```javascript
// Example of correct pattern
const conversations = await fetchAllConversations(orgId, conversationsList, batchSize);
// CRITICAL: Always use batchSize parameter
// CRITICAL: Always include error handling
```

## 🔗 RELATED ISSUES/COMMITS (REQUIRED if applicable)
- Previous fixes for same issue
- Related memory management commits
- API endpoint changes
- Browser compatibility fixes

## 🎯 TESTING VERIFIED (REQUIRED)
- Specific project sizes tested (empty, small, medium, large)
- Browser compatibility verified
- Memory usage confirmed stable
- Error scenarios tested
- Expected behavior confirmed
```

#### Why Detailed Commits Are Critical:

1. **Prevent Recurring Mistakes**
   - Document exact technical causes
   - Provide clear before/after patterns
   - Reference previous fixes to avoid cycles

2. **Knowledge Transfer**  
   - Future developers understand context
   - Memory management patterns preserved
   - API integration best practices documented

3. **Regression Prevention**
   - Clear patterns to follow/avoid
   - Memory efficiency requirements
   - Browser compatibility considerations

4. **Project Memory**
   - Complex debugging scenarios preserved
   - Performance optimization history
   - API evolution documentation

## Browser-Specific Considerations

### Chrome/Edge:
- Excellent performance with large projects
- Reliable download handling for multiple files
- Good memory management for chunked processing

### Firefox:
- May require download permission prompts
- Similar performance to Chrome for most operations
- Good support for all features

### Safari:
- More restrictive download policies
- May need user interaction for large file downloads
- Test memory management more thoroughly

## Performance Benchmarks

### Expected Performance:
- **Small projects** (≤20 conversations): 10-30 seconds
- **Medium projects** (21-100 conversations): 1-3 minutes  
- **Large projects** (101-200 conversations): 3-8 minutes
- **Very large projects** (>200 conversations): 10-20+ minutes

### Memory Usage:
- Peak memory usage should not exceed 500MB
- Chunked processing keeps memory under 200MB for large projects
- Garbage collection hints help prevent memory leaks

This comprehensive context should help with any development, debugging, or enhancement tasks for the Claude Project Conversations Exporter.