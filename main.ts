// It's assumed that the environment provides Angular's core functionalities and Zone.js
// For a real Angular app, these would be part of the build process.
import 'zone.js'; 
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
