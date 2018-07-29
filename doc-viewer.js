class DocViewer {
	constructor() {
		this.loader = document.getElementById('loader');
		this.document = null;

		this.setLoaderVisible(true);
		this.loadDocument();
	}

	setLoaderVisible(bool) {
		this.loader.style.visibility = (bool ? 'visible' : 'hidden');
	}

	setDocumentTitle(title) {
		document.title = `Document Viewer [${title}]`
	}

	loadDocument() {
		var xhr = new XMLHttpRequest()
		xhr.open('get', 'document');
		xhr.onreadystatechange = () => {
			if ((xhr.readyState === XMLHttpRequest.DONE) && (xhr.status === 200)) {
				this.onDocumentLoaded(xhr.responseText);
			}
		};
		xhr.send();
	}

	onDocumentLoaded(data) {
		this.document = JSON.parse(data);
		this.setDocumentTitle(this.document.title);
		console.log(this.document);
	}
}