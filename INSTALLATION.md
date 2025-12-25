# Installation Notes

## DuckDB Native Module

The `duckdb` npm package requires native compilation. If installation fails:

### Option 1: Install with system dependencies (macOS)

```bash
# Install Xcode Command Line Tools (if not already installed)
xcode-select --install

# Then install dependencies
npm install
```

### Option 2: Use prebuilt binaries

The DuckDB package should automatically download prebuilt binaries for your platform. If it falls back to building from source and fails, you may need to:

1. Ensure you have build tools installed (Xcode on macOS, Visual Studio Build Tools on Windows)
2. Or manually download the prebuilt binary from the DuckDB releases page

### Option 3: Alternative approach (future)

We may switch to using DuckDB via command-line interface or WebAssembly version for better compatibility with VS Code extensions.

## Development Setup

1. Install Node.js 20 or higher
2. Run `npm install`
3. Press F5 in VS Code to launch the extension in a new window
4. The extension will be loaded and you can test it

## Building

```bash
npm run compile
```

This will compile TypeScript to JavaScript in the `out/` directory.

