import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as cp from "child_process";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension.createCommitMsgHook",
    async () => {
      const rootPath = vscode.workspace.rootPath;
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor!");
        return;
      }

      let requiredPattern = await vscode.window.showInputBox({
        prompt: "Enter the required pattern",
      });
      if (!requiredPattern) {
        vscode.window.showErrorMessage("Required pattern is required");
        return;
      }

      let taskPattern = await vscode.window.showInputBox({
        prompt: "Enter the task pattern",
      });
      if (!taskPattern) {
        vscode.window.showErrorMessage("Task pattern is required");
        return;
      }

      let messageExample = await vscode.window.showInputBox({
        prompt:
          "Enter an example of a valid comment that will be posted to GitHub",
      });
      if (!messageExample) {
        vscode.window.showErrorMessage("Message example is required");
        return;
      }

      if (!requiredPattern || !taskPattern || !messageExample) {
        return;
      }

      const document = editor.document;
      let text = document.getText();

      text = text.replace(
        /requiredPattern=".*"/,
        `requiredPattern="${requiredPattern}"`
      );
      text = text.replace(/taskPattern=".*"/, `taskPattern="${taskPattern}"`);
      text = text.replace(
        /messageExample=".*"/,
        `messageExample="${messageExample}"`
      );
      text = text.replace(
        /echo "\\\${GREEN}.*\\\${NC}"/,
        `echo "\\\${GREEN}${messageExample}\\\${NC}"`
      );

      const edit = new vscode.WorkspaceEdit();
      edit.replace(
        document.uri,
        new vscode.Range(
          document.positionAt(0),
          document.positionAt(text.length)
        ),
        text
      );
      await vscode.workspace.applyEdit(edit);

      if (rootPath) {
        cp.exec("node -v", (err, stdout) => {
          if (err) {
            vscode.window.showErrorMessage(
              `Failed to get Node.js version: ${err.message}`
            );
            return;
          }

          const version = stdout.trim().slice(1);
          if (version < "10.22.0") {
            vscode.window.showErrorMessage(
              "Your Node.js version is too low for Husky. Please upgrade Node.js to v10.22.0 or higher."
            );
            return;
          }

          if (rootPath) {
            const huskyPath = path.join(rootPath, "node_modules", "husky");
            if (!fs.existsSync(huskyPath)) {
              vscode.window
                .showErrorMessage(
                  "Husky is not installed in this project. Please install it before creating the hook.",
                  "Install Husky"
                )
                .then((selection) => {
                  if (selection === "Install Husky") {
                    cp.exec("npm install husky", { cwd: rootPath }, (err) => {
                      if (err) {
                        vscode.window.showErrorMessage(
                          `Failed to install Husky: ${err.message}`
                        );
                      } else {
                        vscode.window.showInformationMessage(
                          "Husky installed successfully"
                        );

                        cp.exec("npm install", { cwd: rootPath }, (err) => {
                          if (err) {
                            vscode.window.showErrorMessage(
                              `Failed to run npm install: ${err.message}`
                            );
                          } else {
                            vscode.window.showInformationMessage(
                              "NPM install ran successfully"
                            );
                            cp.exec(
                              "NPX husky install",
                              { cwd: rootPath },
                              (err) => {
                                if (err) {
                                  vscode.window.showErrorMessage(
                                    `Failed to run husky install: ${err.message}`
                                  );
                                } else {
                                  vscode.window.showInformationMessage(
                                    "Husky hooks installed successfully"
                                  );
                                  const hookDir = path.join(rootPath, ".husky");
                                  const preCommitPath = path.join(
                                    hookDir,
                                    "pre-commit"
                                  );

                                  fs.writeFile(preCommitPath, "", (err) => {
                                    if (err) {
                                      vscode.window.showErrorMessage(
                                        `Failed to create pre-commit hook: ${err.message}`
                                      );
                                    } else {
                                      vscode.window.showInformationMessage(
                                        "pre-commit hook created successfully"
                                      );

                                      const commitMsgPath = path.join(
                                        hookDir,
                                        "commit-msg"
                                      );
                                      const commitMsgContent = `#!/bin/sh
                                      . "$(dirname "$0")/_/husky.sh"

                                      RED='\x1B[0;31m'    # Red color
                                      GREEN='\x1B[0;32m'  # Green color
                                      YELLOW='\x1B[0;33m' # Yellow color
                                      NC='\x1B[0m'        # Reset color


                                      message="\$(cat "\$1")"
                                      requiredPattern="${requiredPattern}"
                                      taskPattern="${taskPattern}"
                                      messageExample="${messageExample}"
                                      if ! [[ \$message =~ \$requiredPattern ]]; then
                                      echo "\${RED}🚨 Wrong commit message format! 😕\${NC}"
                                      echo "\${GREEN}The commit message must follow this format:\${NC}"
                                      echo "\${GREEN}\$messageExample\${NC}"
                                      echo "\${RED}Your commit message was:\${NC}"
                                      echo "\${RED}\$message\${NC}"
                                      echo "\${YELLOW}For more information, check the script in .husky/commit-msg\${NC}"
                                      exit 1
                                      fi

                                      title="\$(echo "\$message" | head -n 1)"
                                      if ! [[ \$title =~ \$taskPattern ]]; then
                                      echo "\${RED}🚨 Wrong commit message format! 😕\${NC}"
                                      echo "\${GREEN}\$messageExample\${NC}"
                                      echo "\${RED}Your commit message was:\${NC}"
                                      echo "\${RED}\$message\${NC}"
                                      echo "\${YELLOW}For more information, check the script in .husky/commit-msg\${NC}"
                                      exit 1
                                      fi
                                      `;

                                      fs.writeFile(
                                        commitMsgPath,
                                        commitMsgContent,
                                        { mode: 0o755 },
                                        (err) => {
                                          if (err) {
                                            vscode.window.showErrorMessage(
                                              `Failed to create commit-msg hook: ${err.message}`
                                            );
                                          } else {
                                            vscode.window.showInformationMessage(
                                              "Commit-msg hook created successfully"
                                            );
                                          }
                                        }
                                      );
                                    }
                                  });
                                }
                              }
                            );
                          }
                        });
                        const packageJsonPath = path.join(
                          rootPath,
                          "package.json"
                        );

                        interface PackageJson {
                          name: string;
                          version: string;
                          scripts: { [key: string]: string };
                        }

                        fs.readFile(
                          packageJsonPath,
                          "utf8",
                          (err, fileContents) => {
                            if (err) {
                              vscode.window.showErrorMessage(
                                `Failed to read package.json at ${packageJsonPath}: ${err.message}`
                              );
                              return;
                            }

                            let packageJson: PackageJson;
                            try {
                              packageJson = JSON.parse(fileContents);
                            } catch (err) {
                              if (err instanceof Error) {
                                vscode.window.showErrorMessage(
                                  `Failed to parse package.json at ${packageJsonPath}: ${err.message}`
                                );
                              }

                              return;
                            }

                            if (!packageJson.scripts) {
                              packageJson.scripts = {};
                            }

                            if (!packageJson.scripts["prepare"]) {
                              packageJson.scripts["prepare"] = "husky install";

                              fs.writeFile(
                                packageJsonPath,
                                JSON.stringify(packageJson, null, 2),
                                (err) => {
                                  if (err) {
                                    vscode.window.showErrorMessage(
                                      `Failed to write to package.json at ${packageJsonPath}: ${err.message}`
                                    );
                                  }
                                }
                              );
                            }
                          }
                        );
                      }
                    });
                  }
                });
              return;
            }
          }

          try {
            require.resolve("husky");
          } catch (err) {
            vscode.window
              .showErrorMessage(
                "Husky is not installed in this project. Please install it before creating the hook.",
                "Install Husky"
              )
              .then((selection) => {
                if (selection === "Install Husky") {
                  cp.exec("npm install husky", { cwd: rootPath }, (err) => {
                    if (err) {
                      vscode.window.showErrorMessage(
                        `Failed to install Husky: ${err.message}`
                      );
                    } else {
                      vscode.window.showInformationMessage(
                        "Husky installed successfully"
                      );
                    }
                  });
                }
              });
            return;
          }

          const hookDir = path.join(rootPath, ".husky");
          fs.mkdir(hookDir, { recursive: true }, (err) => {
            if (err) {
              vscode.window.showErrorMessage(
                `Failed to create directory: ${err.message}`
              );
              return;
            }
          });
        });
      } else {
        vscode.window.showErrorMessage("No workspace open");
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
