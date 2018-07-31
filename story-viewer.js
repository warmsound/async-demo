class StoryViewer {
	setLoaderVisible(bool) {
		var loader = document.getElementById('loader');
		loader.style.visibility = (bool ? 'visible' : 'hidden');
	}

	setStoryTitle(title) {
		var titleElement = document.getElementById('title');
		titleElement.innerText = title;
	}

	insertChapter(id, text) {
		var div = document.createElement('div');
		div.classList.add('chapter');
		div.innerText = `[${id}] ${text}`;
		document.body.appendChild(div);
	}

	reportError(status, message) {
		console.error(`${status}: ${message}`);
	}

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
		
		this.loadStory(this.onStoryLoaded.bind(this), this.onError.bind(this));
	}

	loadStory(onSuccess, onError) {
		var xhr = new XMLHttpRequest()
		xhr.open('get', 'story');
		xhr.addEventListener('readystatechange', () => {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if (xhr.status === 200) {
					onSuccess && onSuccess.call(this, xhr.responseText);
				} else if (xhr.status === 404) {
					onError && onError.call(this, xhr.statusText, xhr.responseText);
				}
			}
		});
		xhr.send();
	}

	onError(status, response) {
		var response = JSON.parse(response);
		this.reportError(status, response.error);
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
				}, this.onError.bind(this));
			}			
			nextChapter.call(this); // Get the loop started.

		// Chapter requests should be in parallel.
		} else {
			
			for (let i = 0; i < this.story.chapters.length; ++i) {
				this.loadChapter(i, this.story.chapters[i], this.onChapterLoaded.bind(this), this.onError.bind(this));
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
					onError && onError.call(this, xhr.statusText, xhr.responseText);
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
