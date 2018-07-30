describe('StoryViewer', () => {
	var expect = chai.expect;

	// Fake XMLHttpRequest spies.
	var openSpy;
	var sendAsyncSpy;

	var viewer;

	// StoryViewer spies.
	var setLoaderVisibleSpy;
	var setStoryTitleSpy;
	var insertChapterSpy;

	/** 
	 * Return a Promise that resolves with the specified value, after the specified timeout.
	 * @param {Any} resolveWithValue Value with which to resolve Promise.
	 * @param {Integer} timeout Number of milliseconds after which to resolve Promise
	 * @returns {Promise}
	*/
	function delay(resolveWithValue, timeout) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve(resolveWithValue);
			}, timeout);
		});
	};

	before(() => {
		XHRMock.setup();

		openSpy = sinon.spy(XMLHttpRequest.prototype, 'open');
		sendAsyncSpy = sinon.spy(XMLHttpRequest.prototype, 'sendAsync');

		setLoaderVisibleSpy = sinon.spy(StoryViewer.prototype, 'setLoaderVisible');
		setStoryTitleSpy = sinon.spy(StoryViewer.prototype, 'setStoryTitle');
		insertChapterSpy = sinon.spy(StoryViewer.prototype, 'insertChapter');
	});

	afterEach(() => {
		XHRMock.reset(); // Reset request handlers.
		viewer.reset(); // Reset viewer *before* resetting spies.

		openSpy.resetHistory();
		sendAsyncSpy.resetHistory();

		setLoaderVisibleSpy.resetHistory();
		setStoryTitleSpy.resetHistory();
		insertChapterSpy.resetHistory();
	});

	after(() => {
		XHRMock.teardown();

		openSpy.restore();
		sendAsyncSpy.restore();	
		
		setLoaderVisibleSpy.restore();
		setStoryTitleSpy.restore();
		insertChapterSpy.restore();
	});

	it('Should immediately show loader', () => {
		var loader = document.getElementById('loader');

		expect(setLoaderVisibleSpy.called).to.be.false;
		viewer = new StoryViewer();
		expect(setLoaderVisibleSpy.calledWith(true)).to.be.true;
	});

	it('Should immediately request story', () => {
		viewer = new StoryViewer();

		expect(openSpy.calledWith('get', 'story')).to.be.true;
		expect(sendAsyncSpy.called).to.be.true;
	});

	it('Should hide loader immediately once story is received (response takes 2s)', () => {
		XHRMock.get('story', (req, res) => {
			var response = res.status(200).body(JSON.stringify({
				title: 'My Story',
				chapters: []
			}));

			return delay(response, 2000);
		});

		viewer = new StoryViewer();

		expect(setLoaderVisibleSpy.calledWith(false)).to.be.false;

		// sendAsyncSpy() returns a Promise that resolves when the response has been sent.
		// Test is done() once Promise returned by then() resolves.
		return sendAsyncSpy.returnValues[0].then(() => {
			expect(setLoaderVisibleSpy.calledWith(false)).to.be.true;
		});
	}).timeout(5000);

	it('Should set story title immediately once story is received (response takes 2s)', () => {
		XHRMock.get('story', (req, res) => {
			var response = res.status(200).body(JSON.stringify({
				title: 'My Story',
				chapters: []
			}));

			return delay(response, 2000);
		});

		viewer = new StoryViewer();

		expect(setStoryTitleSpy.called).to.be.false;
		return sendAsyncSpy.returnValues[0].then(() => {
			expect(setStoryTitleSpy.calledWith('My Story')).to.be.true;
		});
	}).timeout(5000);

	it('Should show loader for at least 1 second (response is immediate)', done => {
		XHRMock.get('story', (req, res) => {
			return res.status(200).body(JSON.stringify({
				title: 'My Story',
				chapters: []
			}));
		});

		viewer = new StoryViewer();

		// Loader should not be hidden immediately.
		expect(setLoaderVisibleSpy.calledWith(false)).to.be.false;

		// Loader should not be hidden immediately after receiving story.
		sendAsyncSpy.returnValues[0].then(() => {
			expect(setLoaderVisibleSpy.calledWith(false)).to.be.false;
		});

		// Loader should be hidden after 1s (check after 2s).
		setTimeout(() => {
			expect(setLoaderVisibleSpy.calledWith(false)).to.be.true;
			done();
		}, 2000);
	}).timeout(5000);
});
