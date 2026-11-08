import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { installWebMCP } from '@mcp-b/webmcp-polyfill';

installWebMCP();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
