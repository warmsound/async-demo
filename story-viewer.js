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
		this.setLoaderVisible(false);
		this.setStoryTitle('');
		
		var chapters = document.querySelectorAll('.chapter');
		for (let i = 0; i < chapters.length; ++i) {
			let chapter = chapters[i];
			chapeter.parentNode.removeChild(chapter);
		}
	}

	constructor() {
		// Set a timeout, so we can check that loader has been shown for minimum time once story has loaded.
		this.minLoaderTimeout = setTimeout(() => {
			this.minLoaderTimeout = null;

			// If story has loaded within minimum time, only now hide loader.
			if (this.story) {
				this.setLoaderVisible(false);
			}
		}, StoryViewer.MIN_LOADER_TIME);
		this.setLoaderVisible(true);

		this.story = null;
		this.loadStory();
	}	

	loadStory() {
		var xhr = new XMLHttpRequest()
		xhr.open('get', 'story');
		xhr.addEventListener('readystatechange', () => {
			if ((xhr.readyState === XMLHttpRequest.DONE) && (xhr.status === 200)) {
				this.onStoryLoaded(xhr.responseText);
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
		this.setStoryTitle(this.story.title);

		for (let i = 0; i < this.story.chapters.length; ++i) {
			this.loadChapter(this.story.chapters[i]);
		}
	}

	loadChapter(id) {
		var xhr = new XMLHttpRequest()
		xhr.open('get', `chapter?id=${id}`);
		xhr.addEventListener('readystatechange', () => {
			if ((xhr.readyState === XMLHttpRequest.DONE) && (xhr.status === 200)) {
				this.onChapterLoaded(xhr.responseText);
			}
		});
		xhr.send();
	}

	onChapterLoaded(data) {
		var chapter = JSON.parse(data);
		this.insertChapter(chapter.id, chapter.text);
	}
}

StoryViewer.MIN_LOADER_TIME = 1000;
