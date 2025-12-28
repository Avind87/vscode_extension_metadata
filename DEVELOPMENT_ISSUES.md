# Development Issues and Solutions

This document records issues encountered during development and how they were resolved to prevent recurrence.

## Issue 1: JavaScript Not Running in Webview

### Problem
JavaScript code in the webview HTML file was not executing, causing buttons to be unresponsive and the interface to be non-functional.

### Root Cause
TypeScript type annotations (`: string[]`, `: any`, `new Set<string>()`) were used in JavaScript code within the HTML file. JavaScript does not support TypeScript type annotations, causing syntax errors that prevented the entire script from executing.

### Solution
Removed all TypeScript type annotations from JavaScript code in `media/editor.html`:
- Changed `new Set<string>()` to `new Set()`
- Removed `: string[]` type annotations
- Removed `: any` type annotations

### Prevention
- **Rule**: Never use TypeScript type annotations in JavaScript code within HTML files
- **Validation**: Use `node -e` to validate JavaScript syntax before committing
- **Testing**: Always test that JavaScript executes by checking browser console or adding simple test alerts

## Issue 2: Content Security Policy (CSP) Breaking Scripts

### Problem
Added a custom Content Security Policy meta tag to the HTML, which conflicted with VS Code's built-in CSP handling, preventing JavaScript from running.

### Root Cause
VS Code webviews automatically handle CSP when `enableScripts: true` is set in the webview panel configuration. Adding a custom CSP meta tag created conflicts and blocked script execution.

### Solution
Removed the custom CSP meta tag entirely. VS Code handles CSP automatically for webviews with `enableScripts: true`.

### Prevention
- **Rule**: Never add custom CSP meta tags to VS Code webview HTML
- **Note**: VS Code automatically applies appropriate CSP when `enableScripts: true` is set
- **Reference**: VS Code webview documentation on CSP handling

## Issue 3: Duplicate Message Listeners

### Problem
Multiple `window.addEventListener('message', ...)` listeners were created, causing message handling conflicts and potential race conditions.

### Root Cause
Message listeners were added in multiple places during development without consolidating existing ones.

### Solution
Consolidated all message handling into a single `window.addEventListener('message', ...)` with a switch statement handling all message types.

### Prevention
- **Rule**: Always use a single message listener for webview communication
- **Pattern**: Use a switch statement within one listener to handle all message types
- **Check**: Before adding a new listener, verify if an existing one can handle the message type

## Issue 4: Event Listener Attachment Timing

### Problem
Attempted to replace inline `onclick` handlers with programmatic event listeners, but the listeners weren't attaching correctly, making buttons unresponsive.

### Root Cause
Event listeners were being attached in `DOMContentLoaded` handlers, but the timing wasn't reliable. Also, cloning nodes to remove existing listeners was causing issues.

### Solution
Reverted to simple inline `onclick` handlers (e.g., `onclick="loadMetadata()"`), which are more reliable and simpler for VS Code webviews.

### Prevention
- **Rule**: Prefer inline `onclick` handlers for VS Code webviews unless there's a specific need for programmatic listeners
- **Note**: Inline handlers are simpler, more reliable, and work immediately when HTML loads
- **Alternative**: If programmatic listeners are needed, ensure functions are in global scope and attached after DOM is ready

## Issue 5: HTML Processing Complexity

### Problem
Added complex HTML processing with nonce generation, CSP token replacement, and multiple placeholder replacements, which wasn't necessary and could cause issues.

### Root Cause
Over-engineered the HTML processing based on assumptions about VS Code webview requirements.

### Solution
Simplified HTML processing to only replace `{{DB_PATH}}` placeholder. VS Code handles all other requirements automatically.

### Prevention
- **Rule**: Keep HTML processing minimal - only replace necessary placeholders
- **Principle**: VS Code webviews handle most requirements automatically when configured correctly
- **Test**: Always test with the simplest approach first

## Issue 6: Database Path Not Being Passed from Context Menu

### Problem
Right-clicking a DuckDB file and selecting "Open Data Vault 2.1 Metadata Prep App" still prompted for file selection instead of using the right-clicked file.

### Root Cause
The command handler wasn't properly checking for the `uri` parameter passed by VS Code when called from the context menu.

### Solution
Modified the command handler to prioritize the `uri` parameter:
1. First check if `uri` is provided (from context menu)
2. Then check `uris` array (for multiple selections)
3. Then check active editor
4. Finally prompt user if none of the above

### Prevention
- **Rule**: Always check for `uri` parameter first in VS Code command handlers
- **Pattern**: `vscode.commands.registerCommand('command.id', async (uri?: vscode.Uri, uris?: vscode.Uri[]) => { ... })`
- **Testing**: Test commands from both command palette and context menu

## Issue 7: Async/Await in Non-Async Functions

### Problem
TypeScript compilation errors: "await expressions only allowed in async functions"

### Root Cause
Added `await` calls in functions that weren't marked as `async`.

### Solution
Made functions `async` when they use `await`, and ensured all callers properly await the async functions.

### Prevention
- **Rule**: Any function using `await` must be marked `async`
- **Check**: TypeScript compiler will catch this, but verify before committing
- **Pattern**: `async functionName() { await ... }`

## Issue 8: Panel Reuse Not Updating Content

### Problem
When opening the same panel multiple times with different database files, the content wasn't updating.

### Root Cause
The panel reuse logic wasn't properly updating the HTML content or reloading metadata.

### Solution
When reusing a panel, explicitly call `_update()` to refresh the HTML and send the new database path to the webview.

### Prevention
- **Rule**: Always update panel content when reusing existing panels
- **Pattern**: Check for existing panel, update its state, call `_update()`, then reveal it

## Best Practices Summary

1. **JavaScript in HTML**: Never use TypeScript syntax in HTML JavaScript code
2. **CSP**: Don't add custom CSP - VS Code handles it automatically
3. **Message Listeners**: Use a single consolidated message listener
4. **Event Handlers**: Prefer inline onclick handlers for simplicity
5. **HTML Processing**: Keep it minimal - only replace necessary placeholders
6. **Command Handlers**: Always check for `uri` parameter from context menu
7. **Async Functions**: Mark functions as `async` when using `await`
8. **Panel Management**: Always update content when reusing panels

## Testing Checklist

Before committing changes that affect webview functionality:

- [ ] JavaScript syntax is valid (no TypeScript annotations in HTML)
- [ ] Buttons respond to clicks
- [ ] Messages are sent and received correctly
- [ ] Context menu works with right-clicked files
- [ ] Panel reuses correctly when opening multiple files
- [ ] No console errors in webview developer tools
- [ ] No TypeScript compilation errors

