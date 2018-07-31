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
		
		this.loadStory(this.onStoryLoaded.bind(this));
	}	

	loadStory(callback) {
		var xhr = new XMLHttpRequest()
		xhr.open('get', 'story');
		xhr.addEventListener('readystatechange', () => {
			if ((xhr.readyState === XMLHttpRequest.DONE) && (xhr.status === 200)) {
				callback && callback.call(this, xhr.responseText);
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
				});
			}			
			nextChapter.call(this); // Get the loop started.

		// Chapter requests should be in parallel.
		} else {
			for (let i = 0; i < this.story.chapters.length; ++i) {
				this.loadChapter(i, this.story.chapters[i], this.onChapterLoaded.bind(this));
			}
		}
	}

	loadChapter(index, id, callback) {
		var xhr = new XMLHttpRequest()
		xhr.open('get', `chapter?id=${id}`);
		xhr.addEventListener('readystatechange', () => {
			if ((xhr.readyState === XMLHttpRequest.DONE) && (xhr.status === 200)) {
				callback && callback.call(this, index, id, xhr.responseText);
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
