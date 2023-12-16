# Commit Message Hook Generator for VS Code

## Overview

This VS Code extension simplifies the process of creating a pre-commit interceptor to validate commit-msg based on specified patterns.

## Features

### Interactive Configuration:

- Customize commit message templates interactively.
- Automatically generates pre-commit and msg-commit hooks.

### Ready-to-Use Configuration:

- The msg-commit interceptor is pre-configured and ready for immediate use.
- The pre-commit interceptor is created empty, allowing for personalized customization based on specific needs and frameworks.

### Message Validation:

- Checks commit messages against required templates and task templates.
- Provides an example of a valid commit message for reference.

## Usage

1. **Open Your Workspace:**
   - Launch your VS Code workspace.
2. **Configuration Setup:**
   - Navigate to the desired file for commit message configuration.
   - Run the "Create Message Commit" command using the VS Code Command Palette.
3. **Interactive Setup:**
   - Follow the prompts to input required templates, task templates, and an example of a valid commit message.
4. **Automatic Configuration:**
   - The extension updates the file with specified templates and creates necessary hooks.
5. **Execution and Permissions:**
   - Make the pre-commit hook executable using the command: `chmod +x .husky/pre-commit`.

## Requirements

- Node.js version 10.22.0 or higher.
- Husky must be installed in the project; the extension guides you through the installation process if not present.

## Installation

1. **Install from Visual Studio Code Store:**
   - Install the extension from the Visual Studio Code store.
2. **Open Your Workspace:**
   - Launch your VS Code workspace.
3. **Configuration Setup:**
   - Run the "Create Commit Msg Hook" command to configure the hook.

## Configuration Options

The extension allows customization of required templates, task templates, and sample commit messages.

## Issues and Feedback

If you encounter any issues or have feedback, please create an issue on the [GitHub repository](link-to-your-repository).

## Contribution

Contributions are welcome! Fork the repository, make your changes, and submit a pull request.