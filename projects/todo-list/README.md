# Todo List with WebMCP

In this project, an AI agent can **read the todos** and **add todos**
in our Angular app. We did not change the app. We only added a few lines
of WebMCP code to one service.

**WebMCP** lets a web page offer named actions, called **tools**, to an
AI agent. The agent calls a tool instead of guessing which buttons to click.
WebMCP and Angular's support for it are still experimental.

## Run the app

In the project folder:

```sh
npm start
```

Open `http://localhost:4200/`.

## How the app works

- [App](./src/app/app.ts) is the main component. It shows the list on the page.
- [InputButtonUnitComponent](./src/app/components/input-button-unit/input-button-unit.ts) is the text box and the Add button.
- [TodoItemComponent](./src/app/components/todo-item/todo-item.ts) shows one todo. It lets us edit, delete, or complete it.
- [TodoListService](./src/app/services/todo-list.service.ts) holds the list and changes it.
- [StorageService](./src/app/services/storage.service.ts) saves the list in the browser's localStorage.

An AI agent *can* read the HTML, understand the DOM, and click the buttons
like a person. But it is better to make the Angular app expose a set of
**tools** that the agent understands. The agent then works with the app
through these tools and bypasses the UI itself.

## Step 1: Import the WebMCP function

Angular already has WebMCP functions. We do not need to install anything.

Open [todo-list.service.ts](./src/app/services/todo-list.service.ts).
Change the first import line to:

```ts
import { effect, Service, signal, inject, declareExperimentalWebMcpTool } from '@angular/core';
```

`declareExperimentalWebMcpTool` creates a tool and gives it to the browser.
The tool is removed automatically when the service is destroyed.

## Step 2: Add a tool that returns all todos

Inside the `constructor()`, after the existing `effect()`, add:

```ts
declareExperimentalWebMcpTool({
  name: 'get_all_todos',
  description: 'Returns all the todos in the list.',
  annotations: { readOnlyHint: true },
  execute: () => JSON.stringify(this.items()),
}).catch(console.error);
```

What each part does:

- `name` is the name of the tool. The agent uses it to call the tool.
- `description` tells the agent, in plain words, what the tool does.
- `annotations: { readOnlyHint: true }` tells the agent that this tool only reads data.
- `execute` is the code that runs when the agent calls the tool.
  It returns the current list as JSON text. This tool needs no input.
- `.catch(console.error)` shows an error in the browser console if the tool cannot be created.

## Step 3: Add a tool that adds todos

First, create a new file `src/app/utils/schema-validator.ts` with a small
helper function. It checks that a value is a list of strings:

```ts
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
```

This is a **type guard**. When it returns `true`, TypeScript knows that
`value` is a `string[]`. We keep it in its own file so we can reuse it
in other tools later.

Import it in [todo-list.service.ts](./src/app/services/todo-list.service.ts),
next to the other imports:

```ts
import { isStringArray } from '../utils/schema-validator';
```

Then, below the first tool, add:

```ts
declareExperimentalWebMcpTool({
  name: 'add_todos',
  description: 'Add one or more todos to the list.',
  inputSchema: {
    type: 'object',
    properties: {
      titles: {
        type: 'array',
        items: { type: 'string' },
        description: 'The titles of the new todos.',
      },
    },
    required: ['titles'],
    additionalProperties: false,
  },
  execute: ({ titles }) => {
    if (!isStringArray(titles) || titles.length === 0) {
      throw new Error('A non-empty list of titles is required.');
    }
    titles.forEach((title) => this.addItem(title));
    return `Added ${titles.length} todos`;
  },
}).catch(console.error);
```

This tool has an `inputSchema`. It tells the agent what input to send.
Here: a list of text values called `titles`. The agent can add many todos
in one call, or just one.

We still check the input with `isStringArray`. The schema tells the agent
what to send, but the browser does not check it for us.

The tool calls the `addItem()` method that already exists, once for each title.
The list updates on the page and is saved to storage, like when we press Add.
We did not touch the components, the storage, or the other methods.

Save the file. The app reloads. That's all the code.

## Try it in Chrome

### Setup

1. Use a current version of Chrome.
2. Open `chrome://flags/#enable-webmcp-testing`, set it to **Enabled**, and relaunch Chrome.
   WebMCP is experimental, so it is turned off by default. This flag turns it on.
   Without it, `document.modelContext` does not exist and no tools can be registered.
3. Install the [WebMCP - Model Context Tool Inspector](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd) extension.
   It does not add WebMCP to Chrome. It only lets you see and call the tools of a page.

Calling tools by hand needs no AI model or API key.
To talk to the tools in natural language, add a Gemini API key in the extension.

### Use the tools

1. Open the app in Chrome and open the extension's side panel.
2. You should see `get_all_todos` and `add_todos`.
3. Select `add_todos`, enter this input, and execute it:

   ```json
   {"titles": ["Practice Angular", "Read about WebMCP"]}
   ```

   Both todos appear on the page.

4. Select `get_all_todos` and execute it with an empty input:

   ```json
   {}
   ```

   The result is the full list, including the new todos.

With a Gemini API key, you can also type a request in plain words, for example:
**"Add todos for Practice Angular and Read about WebMCP, then show me all my todos."**

If the tools do not appear, open Chrome DevTools and type in the Console:
`typeof document.modelContext?.registerTool`. It should print `"function"`.
If it prints `"undefined"`, check the Chrome version and the flag.

## Try it in VS Code with a custom agent

A **custom agent** is a chat agent with our own instructions.
We created one that uses WebMCP tools and never clicks the page by itself.

### Create the agent

In VS Code, run **Chat: New Custom Agent** and give it this content:

```markdown
---
name: WebMCP Agent
description: "Use web applications through their WebMCP tools."
---

Answer general questions normally.

For actions or questions about a web application:
- Use the shared integrated browser page.
- Discover tools with document.modelContext.getTools().
- Invoke suitable tools with document.modelContext.executeTool().
- Browser navigation and JavaScript execution are allowed only
  to access WebMCP.

## How to call executeTool (polyfill signature)

The app uses the `@mcp-b/webmcp-polyfill`. Its `executeTool` signature is
`executeTool(toolDescriptor, inputArgs)`:

- The FIRST argument must be the full tool object returned by `getTools()`
  (it must include `name`, `description` and `inputSchema`).
  Do NOT pass the tool name as a string, and do NOT pass a
  `{ name, arguments }` object as in MCP's `tools/call`. Both fail with
  "Expected a dictionary" / "description is required".
- The SECOND argument is the input object matching the tool's `inputSchema`.
  Pass `{}` when the tool takes no input.
- The return value is usually a JSON string; parse it if needed.

Always use this exact pattern, in a single `page.evaluate`:

```js
return page.evaluate(async ({ toolName, input }) => {
  const mc = document.modelContext;
  if (!mc) return { error: 'WebMCP not available' };
  const tools = await mc.getTools();
  const tool = tools.find(t => t.name === toolName);
  if (!tool) return { error: `Tool ${toolName} not found` };
  return await mc.executeTool(tool, input);
}, { toolName: 'get_all_todos', input: {} });
```

To discover tools first, call `getTools()` and return
`tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }))`.
- Never use DOM clicks, typing, selectors, or direct app-state changes.
- Never edit project files or run terminal commands to perform an action.
- If WebMCP or a suitable tool is unavailable, stop and explain.
  Do not fall back to UI automation.
```

These instructions tell the agent: use the WebMCP tools of the page, not
simulated clicks. The agent runs a little JavaScript in the browser to call
the tools. No extra server or extension is needed in VS Code.

### Use the agent

1. Open the app with **Browser: Open Integrated Browser** (the globe icon).
2. In the browser toolbar, select **Share with Agent** and confirm.
3. In Chat, select **WebMCP Agent**.
4. Ask:

   > Add todos for Practice Angular and Read about WebMCP.

   Then:

   > What todos do I have?

Watch the page update. In Chat, open the tool call and see that the agent
used WebMCP, not the Add button.

Note: VS Code's integrated browser must support WebMCP for this to work.
Chrome's flag does not affect it. You can check with:
**"Does this page support WebMCP? List its tools. Do not change anything."**
Chrome and VS Code use separate storage, so their lists may be different.

## Summary

With two small tools, an agent can use our app.
People and agents share the same service, signals, and storage.
We did not add a chatbot or an AI key to the app.
You can do the same in your own project: add a tool for each action
you want an agent to do.

## Learn more

- [Angular WebMCP guide](https://angular.dev/ai/webmcp)
- [Chrome WebMCP docs](https://developer.chrome.com/docs/ai/webmcp)
- [VS Code browser tools](https://code.visualstudio.com/docs/agents/run/browser-tools)
