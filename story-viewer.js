class StoryViewer {
	setLoaderVisible(bool) {
		var loader = document.getElementById('loader');
		loader.style.visibility = (bool ? 'visible' : 'hidden');
	}

	setStoryTitle(title) {
		var titleElement = document.getElementById('title');
		titleElement.innerText = title;

		document.title = `Story Viewer [${title}]`
	}

	insertChapter(text) {
		var div = document.createElement('div');
		div.innerText = text;
		document.body.appendChild(div);
	}

	constructor() {
		this.setLoaderVisible(true);
		this.loadStory();
	}	

	loadStory() {
		var xhr = new XMLHttpRequest()
		xhr.open('get', 'story');
		xhr.onreadystatechange = () => {
			if ((xhr.readyState === XMLHttpRequest.DONE) && (xhr.status === 200)) {
				this.onStoryLoaded(xhr.responseText);
			}
		};
		xhr.send();
	}

	onStoryLoaded(data) {
		var story = JSON.parse(data);
		this.setStoryTitle(story.title);
		this.setLoaderVisible(false);

		for (let i = 0; i < story.chapters.length; ++i) {
			this.loadChapter(story.chapters[i]);
		}
	}

	loadChapter(id) {
		var xhr = new XMLHttpRequest()
		xhr.open('get', `chapter?id=${id}`);
		xhr.onreadystatechange = () => {
			if ((xhr.readyState === XMLHttpRequest.DONE) && (xhr.status === 200)) {
				this.onChapterLoaded(xhr.responseText);
			}
		};
		xhr.send();
	}

	onChapterLoaded(data) {
		var chapter = JSON.parse(data);
		this.insertChapter(chapter.text);
	}
}