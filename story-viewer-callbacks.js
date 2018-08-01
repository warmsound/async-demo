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

	constructor() {
		this.story = null;
		this.chapters = null;

		// Set a timeout, so we can check that loader has been shown for minimum time once story has loaded.
		this.minLoaderTimeout = setTimeout(() => {
			this.minLoaderTimeout = null;

			// If story has loaded within minimum time, only now hide loader.
			if (this.story) {
				this.setLoaderVisible(false);
			}
		}, StoryViewer.MIN_LOADER_TIME);
		this.setLoaderVisible(true);
		
		this.loadStory(this.onStoryLoaded.bind(this), this.reportError.bind(this));
	}

	loadStory(onSuccess, onError) {
		var xhr = new XMLHttpRequest()
		xhr.open('get', 'story');
		xhr.addEventListener('readystatechange', () => {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if (xhr.status === 200) {
					onSuccess && onSuccess.call(this, xhr.responseText);
				} else if (xhr.status === 404) {
					onError && onError.call(this, xhr.statusText);
				}
			}
		});
		xhr.send();
	}

	onStoryLoaded(data) {
		// If minimum loader time has expired, hide loader (otherwise, hide loader when minimum time expires).
		if (!this.minLoaderTimeout) {
			this.setLoaderVisible(false);
		}

		this.story = JSON.parse(data);
		this.chapters = Array(this.story.chapters.length).fill(null); // null means: "chapter not yet received".

		this.setStoryTitle(this.story.title);

		// Chapter requests should be in series: recursive callbacks!
		if (this.story.serial) {

			let i = 0;
			function nextChapter() {
				// Shift first chapter from array, and pass to loadChapter().
				this.loadChapter(i, this.story.chapters[i], (index, id, data) => {
					this.onChapterLoaded(index, id, data);

					// Process next chapter, if any remaining.
					++i;
					(i < this.story.chapters.length) && nextChapter.call(this)
				}, this.reportError.bind(this));
			}			
			nextChapter.call(this); // Get the loop started.

		// Chapter requests should be in parallel.
		} else {
			
			for (let i = 0; i < this.story.chapters.length; ++i) {
				this.loadChapter(i, this.story.chapters[i], this.onChapterLoaded.bind(this), this.reportError.bind(this));
			}
		}
	}

	loadChapter(index, id, onSuccess, onError) {
		var xhr = new XMLHttpRequest()
		xhr.open('get', `chapter?id=${id}`);
		xhr.addEventListener('readystatechange', () => {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if (xhr.status === 200) {
					onSuccess && onSuccess.call(this, index, id, xhr.responseText);
				} else if (xhr.status === 404) {
					onError && onError.call(this, xhr.statusText);
				}
			}
		});
		xhr.send();
	}

	onChapterLoaded(index, id, data) {
		this.chapters[index] = JSON.parse(data);

		// Insert all contiguous received chapters, in order.
		for (let i = 0; i < this.chapters.length; ++i) {
			let chapter = this.chapters[i];

			// This chapter was not yet received. Do not add any more yet.
			if (chapter === null) {
				break;
			}

			//  This chapter was received (now or previously), but was not yet inserted. Insert now.
			if (!chapter.inserted) {
				chapter.inserted = true;
				this.insertChapter(chapter.id, chapter.text);
			}
		}
	}
}

StoryViewer.MIN_LOADER_TIME = 1000;
