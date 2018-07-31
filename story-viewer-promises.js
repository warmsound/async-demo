class StoryViewer {
	//#region Pre-defined API
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

	reportError(status) {
		console.error(status);
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
	//#endregion

	constructor() {
		var storyPromise = this.request('story').then(storyData => {
			this.story = JSON.parse(storyData);
			this.setStoryTitle(this.story.title);
		}).catch(this.reportError);

		var minLoaderDelayPromise = new Promise((resolve, reject) => {
			setTimeout(resolve, StoryViewer.MIN_LOADER_TIME);
		});

		this.setLoaderVisible(true);
		Promise.all([storyPromise, minLoaderDelayPromise]).then(() => {
			this.setLoaderVisible(false);
		});
	}

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
}

StoryViewer.MIN_LOADER_TIME = 1000;
