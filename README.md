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

A commented template implementation for `StoryViewer` is in `story-viewer.js`. You can use this as a starting point for your own implementation. **Leave the `#region Pre-defined API` alone, as tests depend on it.** Begin implementing from the `// TODO.` in `constructor()`.

### Server API

Request the story from the server using a `GET 'story'` request.

The response will be a status 200 with a JSON string representation of the following object:
```
{
  title: 'My Story',
  chapters: ['chapter1', 'chapter2', 'chapter3', 'chapter4']
  serial: true
}
```

If the `serial` flag is set, chapters should be requested one after the other i.e. no overlapping requests.
If the `serial` flag is not set, chapters can be requested in parallel.

Request each chapter from the server using a `GET 'chapter?id=<ID>'` request. The chapter IDs are returned as the `chapters` array in the story definition above.

The response will be a status `200` with a JSON string representation of the following object:
```
{
  id: 'chapter1',
  text: 'Lorem ipsum'
}
```

Responses may fail with status `404` if the story, or chapter, is not found.
