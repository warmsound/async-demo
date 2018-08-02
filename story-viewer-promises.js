/**
 * An app that should display a story title and chapters.
 * 
 * Request the story from the server using a GET 'story' request.
 * 
 * The response will be a status 200 with a JSON string representation of the following object:
 * <pre>
 * 		{
 * 			title: 'My Story',
 * 			chapters: ['chapter1', 'chapter2', 'chapter3', 'chapter4']
 * 			serial: true
 * 		}
 * </pre>
 * 
 * If the <code>serial</code> flag is set, chapters should be requested one after the other i.e. no overlapping requests.
 * If the <code>serial</code> flag is not set, chapters can be requested in parallel.
 * 
 * Request each chapter from the server using a GET 'chapter?id=' request.
 * 
 * The response will be a status 200 with a JSON string representation of the following object:
 * <pre>
 * 		{
 * 			id: 'chapter1',
 * 			text: 'Lorem ipsum'
 * 		}
 * </pre>
 * 
 * Responses may fail with status 404 if the story, or chapter, is not found.
 */
class StoryViewer {
	//#region Pre-defined API
	
	/**
	 * Show or hide the loading animation.
	 * @param {Boolean} bool Show the loader if true; hide the loader if false.
	 */
	setLoaderVisible(bool) {
		var loader = document.getElementById('loader');
		loader.style.visibility = (bool ? 'visible' : 'hidden');
	}

	/**
	 * Set the story title text.
	 * @param {String} text Title text.
	 */
	setStoryTitle(title) {
		var titleElement = document.getElementById('title');
		titleElement.innerText = title;
	}

	/**
	 * Display a new chapter in the DOM.
	 * @param {String} id ID of the chapter to insert (provided by server in initial story definition).
	 * @param {String} text Text content of the chapter.
	 */
	insertChapter(id, text) {
		var div = document.createElement('div');
		div.classList.add('chapter');
		div.innerText = `[${id}] ${text}`;
		document.body.appendChild(div);
	}

	/**
	 * Report an error e.g. if story or chapter loading fails.
	 * @param {String} status Status of the error.
	 */
	reportError(status) {
		console.error(status);
	}

	/**
	 * Reset the DOM, and internal state variables.
	 * Called after each test.
	 */
	reset() {
		this.story = null;
		this.chapters = null;

		this.setLoaderVisible(false);
		this.setStoryTitle('');
		
		var chapters = document.querySelectorAll('.chapter');
		for (let i = 0; i < chapters.length; ++i) {
			let chapter = chapters[i];
			chapter.parentNode.removeChild(chapter);
		}
	}
	//#endregion

	request(url) {
		return new Promise((resolve, reject) => {
			var xhr = new XMLHttpRequest()
			xhr.open('get', url);
			xhr.addEventListener('readystatechange', () => {
				if (xhr.readyState === XMLHttpRequest.DONE) {
					if (xhr.status === 200) {
						resolve(xhr.responseText);
					} else if (xhr.status === 404) {
						reject(xhr.statusText);
					}
				}
			});
			xhr.send();
		});
	}

	constructor() {
		//this.story = null;
		//this.chapters = null;

		this.requestStory();
	}

	requestStory() {
		var storyPromise = this.request('story').then(storyData => {
			var story = JSON.parse(storyData);
			this.setStoryTitle(story.title);

			// Ensure any errors thrown by chapter requests are caught below.
			return this.requestChapters(story);
		}).catch(this.reportError);

		var minLoaderDelayPromise = new Promise((resolve, reject) => {
			setTimeout(resolve, StoryViewer.MIN_LOADER_TIME);
		});

		this.setLoaderVisible(true);
		Promise.all([storyPromise, minLoaderDelayPromise]).then(() => {
			this.setLoaderVisible(false);
		});
	}

	requestChapters(story) {
		if (story.serial) {

			// Return final Promise chain from reduce(), so that any errors are handled at the top level.
			return story.chapters.reduce((promiseChain, thisChapterId) => {

				// Enqueue each chapter request.
				return promiseChain.then(() => {
					return this.request(`chapter?id=${thisChapterId}`);
				});
			}, Promise.resolve()); // Initialise chain with Resolved Promise at head.
		} else {
			// TODO.
		}
	}	
}

/**
 * Minimum number of milliseconds the loader should be shown for.
 */
StoryViewer.MIN_LOADER_TIME = 1000;
