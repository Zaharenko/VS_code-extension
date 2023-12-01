"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function activate(context) {
    let disposable = vscode.commands.registerCommand("extension.createCommitMsgHook", () => {
        const rootPath = vscode.workspace.rootPath;
        if (rootPath) {
            const hookPath = path.join(rootPath, ".git", "hooks", "commit-msg");
            const hookScript = `#!/bin/sh

		message="\$(cat "\$1")"
		requiredPattern="^(ui|metrics)#\\d .{1,50}$"

		if ! [[ \$message =~ \$requiredPattern ]]; then
		echo "Invalid commit message!"
		exit 1
		fi
		`;
            fs.writeFile(hookPath, hookScript, { mode: 0o755 }, (err) => {
                if (err) {
                    vscode.window.showErrorMessage(`Failed to create commit-msg hook: ${err.message}`);
                }
                else {
                    vscode.window.showInformationMessage("commit-msg hook created successfully");
                }
            });
        }
        else {
            vscode.window.showErrorMessage("No workspace open");
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map