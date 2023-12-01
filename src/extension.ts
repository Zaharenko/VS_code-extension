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
		prompt: "Enter an example of a valid comment that will be posted to GitHub",
	  });
	  if (!messageExample) {
		vscode.window.showErrorMessage("Message example is required");
		return;
	  }

      if (!requiredPattern || !taskPattern || !messageExample) {
        // Пользователь не ввел одно из значений
        return;
      }

      // Получить всё содержимое файла
      const document = editor.document;
      let text = document.getText();

      // Заменить старые значения на новые
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

      // Записать обновленный текст обратно в файл
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

          const version = stdout.trim().slice(1); // remove the 'v' prefix
          if (version < "10.22.0") {
            vscode.window.showErrorMessage(
              "Your Node.js version is too low for Husky. Please upgrade Node.js to v10.22.0 or higher."
            );
            return;
          }

          try {
            require.resolve("husky");
            // Husky is installed, continue with your code
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

          const packageJsonPath = path.join(rootPath || "", "package.json");
          let packageJson;

          try {
            const fileContents = fs.readFileSync(packageJsonPath, "utf8");
            console.log(`Contents of package.json: ${fileContents}`);
            packageJson = JSON.parse(fileContents);
          } catch (err) {
            if (err instanceof Error) {
              vscode.window.showErrorMessage(
                `Failed to read or parse package.json at ${packageJsonPath}: ${err.message}`
              );
            }
            return;
          }

          try {
            packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
          } catch (err) {
            if (err instanceof Error) {
              vscode.window.showErrorMessage(
                `Failed to read or parse package.json at ${packageJsonPath}: ${err.message}`
              );
            }
            return;
          }

          if (!packageJson.scripts) {
            packageJson.scripts = {};
          }

          packageJson.scripts["prepare"] = "husky install";

          if (!packageJson.scripts["lint:fix"]) {
            packageJson.scripts["lint:fix"] = "eslint --fix ."; // Замените на вашу команду
          }

          if (!packageJson.scripts["test:unit"]) {
            packageJson.scripts["test:unit"] = "jest"; // Замените на вашу команду
          }

          try {
            fs.writeFileSync(
              packageJsonPath,
              JSON.stringify(packageJson, null, 2)
            );
          } catch (err) {
            if (err instanceof Error) {
              vscode.window.showErrorMessage(
                `Failed to write to package.json at ${packageJsonPath}: ${err.message}`
              );
            }
          }

          const hookDir = path.join(rootPath, ".hucky");
          fs.mkdir(hookDir, { recursive: true }, (err) => {
            if (err) {
              vscode.window.showErrorMessage(
                `Failed to create directory: ${err.message}`
              );
              return;
            }

            const preCommitScript = `#!/usr/bin/env sh\n. "$(dirname -- "$0")/_/husky.sh"\n\nnpm run lint:fix && npm run test:unit`;
            const preCommitPath = path.join(hookDir, "pre-commit");
            fs.writeFileSync(preCommitPath, preCommitScript);

            const hookPath = path.join(hookDir, "commit-msg");

            const config = vscode.workspace.getConfiguration("myExtension");

            const hookScript = `#!/usr/bin/env bash
			. "$(dirname -- "$0")/_/husky.sh""
			
			
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

            fs.writeFile(hookPath, hookScript, { mode: 0o755 }, (err) => {
              if (err) {
                vscode.window.showErrorMessage(
                  `Failed to create commit-msg hook: ${err.message}`
                );
              } else {
                vscode.window.showInformationMessage(
                  "commit-msg hook created successfully"
                );
              }
            });
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
