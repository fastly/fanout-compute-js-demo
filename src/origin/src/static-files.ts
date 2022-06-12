/// <reference path='../types/staticFiles.d.ts' />

import { Buffer } from 'buffer';

import mainCss from "./rsrc/main.css.txt";
import mainJs from "./rsrc/main.js.txt";
import robotsTxt from "./rsrc/robots.txt";
import demoManifest from "./rsrc/demo-manifest.txt";
import screenshotPng from "./rsrc/screenshot.png";
import indexHtml from "./rsrc/index.html.txt";

type StaticFileDesc = {
  contentType: string,
  content: BodyInit,
};

// png files are provided to use as base64 strings
// See 'asset/inline' in webpack.config.js
function base64ToArrayBuffer(base64) {
  return Buffer.from(base64, 'base64');
}

const map: Record<string, StaticFileDesc> = {
  '/main.css': { contentType: 'text/css', content: mainCss },
  '/main.js': { contentType: 'application/javascript', content: mainJs },
  '/robots.txt': { contentType: 'text/plain', content: robotsTxt },
  '/.well-known/fastly/demo-manifest': { contentType: 'text/plain', content: demoManifest },
  '/images/screenshot.png': { contentType: 'image/png', content: base64ToArrayBuffer(screenshotPng) },

  // Serve index file at all other routes
  '*': { contentType: 'text/html', content: indexHtml },
};

export function getStaticFileRoutes() {
  return Object.keys(map);
}

export function getStaticFileDesc(key: string) {
  return map[key];
}
