# devstarter

A tiny CLI to jump into your local Node.js projects and start them instantly.

## Installation

### Homebrew (recommended)

```bash
brew tap dovatgabriel/devstarter
brew install devstarter
```

#### Upgrade later

```bash
brew update
brew upgrade devstarter
```

#### Uninstall

```bash
brew uninstall devstarter
brew untap dovatgabriel/devstarter
```

## Usage

```
# Interactive mode (starts in ~/Developer by default)
devstarter

# Same but using the short alias
ds

# Non-interactive: jump directly into ~/Developer/<name> and run scripts
ds my-project
ds my-project

# Show help / version
ds --help
ds --version
```

### Change default folder

To override the base directory, you must set this environment variable :

```bash
export DEVSTARTER_ROOT=<your directory>
```

### Requirements

- npm must be available on your PATH (the CLI runs npm run <script>).
- macOS (x64 or arm64) for the Homebrew formula.
