# Demonstration of the benefit of asynchronous JavaScript features

## Overview

The Story Viewer app makes asynchronous requests to a mock server, first to download the story, then to download individual chapters.

The aim is implement the Story Viewer app first using callbacks, and then using Promises (and optionally `async/await`), to demonstrate the benefits of Promises.

The app will use `XMLHttpRequest` to make the server requests. The default implementation is replaced by a `MockXMLHttpRequest` from the `xhr-mock' library.

## Technical detail

### Installation

Clone this repo locally, then run `npm install` to install the mock server and testing frameworks.

### Running

The app runs entirely in the browser (there's no need to run a `node` process). The app can run in two modes:

* **Live**: `story-viewer.html`. This runs against a mock server, implemented in `mock-server.js`.
* **Test**: `story-viewer-test.html`. This runs Mocha/Chai tests, implemented in `test/test.js`.

Within each HTML file, you can choose which implementation of the `StoryViewer` class you want to run. Sample implementations using callbacks (`story-viewer-callbacks.js`) and Promises (`story-viewer-promises.js`) are included. Uncomment the `<script`> tag for the file you want run.

A commented template implementation for `StoryViewer` is in `story-viewer.js`. You can use this as a starting point for your own implementation.
