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
	var reportErrorSpy;

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
		reportErrorSpy = sinon.spy(StoryViewer.prototype, 'reportError');
	});

	afterEach(() => {
		XHRMock.reset(); // Reset request handlers.
		viewer.reset(); // Reset viewer *before* resetting spies.

		openSpy.resetHistory();
		sendAsyncSpy.resetHistory();

		setLoaderVisibleSpy.resetHistory();
		setStoryTitleSpy.resetHistory();
		insertChapterSpy.resetHistory();
		reportErrorSpy.resetHistory();
	});

	after(() => {
		XHRMock.teardown();

		openSpy.restore();
		sendAsyncSpy.restore();	
		
		setLoaderVisibleSpy.restore();
		setStoryTitleSpy.restore();
		insertChapterSpy.restore();
		reportErrorSpy.restore();
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

	it('Should hide loader immediately once story is received (response takes 2s)', done => {
		XHRMock.get('story', (req, res) => {
			var response = res.status(200).body(JSON.stringify({
				title: 'My Story',
				chapters: []
			}));

			return delay(response, 2000);
		});

		viewer = new StoryViewer();

		expect(setLoaderVisibleSpy.calledWith(false)).to.be.false;

		// sendAsyncSpy() returns a Promise that resolves when the above response has been sent.
		// Perform checks on next frame, to allow microtasks (Promises) to run first.
		expect(sendAsyncSpy.returnValues[0]).not.to.be.undefined;
		sendAsyncSpy.returnValues[0].then(() => {
			setTimeout(() => {
				expect(setLoaderVisibleSpy.calledWith(false)).to.be.true;
				done();
			}, 0);
		});
	}).timeout(5000);

	it('Should set story title immediately once story is received (response takes 2s)', done => {
		XHRMock.get('story', (req, res) => {
			var response = res.status(200).body(JSON.stringify({
				title: 'My Story',
				chapters: []
			}));

			return delay(response, 2000);
		});

		viewer = new StoryViewer();

		expect(setStoryTitleSpy.called).to.be.false;

		// After story response.
		expect(sendAsyncSpy.returnValues[0]).not.to.be.undefined;
		sendAsyncSpy.returnValues[0].then(() => {
			setTimeout(() => {
				expect(setStoryTitleSpy.calledWith('My Story')).to.be.true;
				done();
			}, 0);			
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
		expect(sendAsyncSpy.returnValues[0]).not.to.be.undefined;
		sendAsyncSpy.returnValues[0].then(() => {
			expect(setLoaderVisibleSpy.calledWith(false)).to.be.false;
		}).then(() => {
			// Loader should be hidden after 1s (check after 2s).
			setTimeout(() => {
				expect(setLoaderVisibleSpy.calledWith(false)).to.be.true;
				done();
			}, 2000);
		});

		
	}).timeout(5000);

	it('Should report returned error if story is not found', done => {
		var status = 'Story not found';

		XHRMock.get('story', (req, res) => {
			return res.status(404).reason(status).body(JSON.stringify({
				error: 'The requested story was not found.'
			}));
		});

		viewer = new StoryViewer();

		expect(reportErrorSpy.called).to.be.false;
		expect(sendAsyncSpy.returnValues[0]).not.to.be.undefined;
		sendAsyncSpy.returnValues[0].then(() => {
			setTimeout(() => {
				expect(reportErrorSpy.calledWith(status)).to.be.true;
				done();
			}, 0);
		});
	});

	// First chapter should be requested; when first is received, second should be requested, etc.
	it('Should request chapters in order serially immediately once story is received', () => {
		XHRMock.get('story', (req, res) => {
			return res.status(200).body(JSON.stringify({
				title: 'My Story',
				chapters: ['chapter1', 'chapter2', 'chapter3'],
				serial: true // Set serial flag to true.
			}));
		});

		XHRMock.get(/^chapter/, (req, res) => {
			var query = req.url().query;
			var id = query && query.id;

			return res.status(200).body(JSON.stringify({
				id,
				text: ''
			}));
		});

		viewer = new StoryViewer();

		// After story response.
		expect(sendAsyncSpy.returnValues[0]).not.to.be.undefined;
		return sendAsyncSpy.returnValues[0].then(() => {
			expect(openSpy.lastCall.calledWith('get', 'chapter?id=chapter1')).to.be.true;

			// After chapter1 response.
			expect(sendAsyncSpy.returnValues[1]).not.to.be.undefined;
			return sendAsyncSpy.returnValues[1].then(() => {
				expect(openSpy.lastCall.calledWith('get', 'chapter?id=chapter2')).to.be.true;

				// After chapter 2 response.
				expect(sendAsyncSpy.returnValues[2]).not.to.be.undefined;
				return sendAsyncSpy.returnValues[2].then(() => {
					expect(openSpy.lastCall.calledWith('get', 'chapter?id=chapter3')).to.be.true;
				});
			});
		});
	});

	it('Should report returned error if chapter is not found', () => {
		var status = 'Chapter not found';

		XHRMock.get('story', (req, res) => {
			return res.status(200).body(JSON.stringify({
				title: 'My Story',
				chapters: ['chapter1', 'chapter2', 'chapter3'],
				serial: true
			}));
		});

		XHRMock.get(/^chapter/, (req, res) => {
			var query = req.url().query;
			var id = query && query.id;

			return res.status(404).reason(status).body(JSON.stringify({
				error: `The requested chapter '${id}' was not found.`
			}));
		});

		viewer = new StoryViewer();

		expect(reportErrorSpy.called).to.be.false;

		// After story response.
		expect(sendAsyncSpy.returnValues[0]).not.to.be.undefined;
		return sendAsyncSpy.returnValues[0].then(() => {

			// After chapter1 response.
			expect(sendAsyncSpy.returnValues[1]).not.to.be.undefined;
			return sendAsyncSpy.returnValues[1].then(() => {
				expect(reportErrorSpy.calledWith(status)).to.be.true;
			});
		});
	});

	it('Should not request further chapters serially if chapter is not found', () => {
		var status = 'Chapter not found';

		XHRMock.get('story', (req, res) => {
			return res.status(200).body(JSON.stringify({
				title: 'My Story',
				chapters: ['chapter1', 'chapter2', 'chapter3'],
				serial: true
			}));
		});

		XHRMock.get(/^chapter/, (req, res) => {
			var query = req.url().query;
			var id = query && query.id;

			return res.status(404).reason(status).body(JSON.stringify({
				error: `The requested chapter '${id}' was not found.`
			}));
		});

		viewer = new StoryViewer();

		expect(reportErrorSpy.called).to.be.false;

		// After story response.
		expect(sendAsyncSpy.returnValues[0]).not.to.be.undefined;
		return sendAsyncSpy.returnValues[0].then(() => {

			// After chapter1 response.
			expect(sendAsyncSpy.returnValues[1]).not.to.be.undefined;
			return sendAsyncSpy.returnValues[1].then(() => {

				// No further requests.
				expect(sendAsyncSpy.returnValues.length).to.equal(2);
			});
		});
	});

	// All chapters should be requested in any order.
	it('Should request all chapters in parallel immediately once story is received', () => {
		XHRMock.get('story', (req, res) => {
			return res.status(200).body(JSON.stringify({
				title: 'My Story',
				chapters: ['chapter1', 'chapter2', 'chapter3']
			}));
		});

		viewer = new StoryViewer();

		expect(sendAsyncSpy.returnValues[0]).not.to.be.undefined;
		return sendAsyncSpy.returnValues[0].then(() => {

			// In parallel mode, chapters can be requested in any order.
			expect(openSpy.calledWith('get', 'chapter?id=chapter1')).to.be.true;
			expect(openSpy.calledWith('get', 'chapter?id=chapter2')).to.be.true;
			expect(openSpy.calledWith('get', 'chapter?id=chapter3')).to.be.true;

			// First spy call is initial story request; chapters after.
			expect(sendAsyncSpy.callCount).to.equal(4);
		});
	});

	it('Should insert chapters immediately once each is received', () => {
		XHRMock.get('story', (req, res) => {
			return res.status(200).body(JSON.stringify({
				title: 'My Story',
				chapters: ['chapter1', 'chapter2', 'chapter3']
			}));
		});

		XHRMock.get(/^chapter/, (req, res) => {
			var query = req.url().query;
			var id = query && query.id;

			var response = res.status(200).body(JSON.stringify({
				id,
				text: ''
			}));

			// Send response async, or else all Promises in sendAsyncSpy.returnValues[] resolve simultaneously.
			return delay(response, 0);
		});

		viewer = new StoryViewer();

		// After story response.
		expect(sendAsyncSpy.returnValues[0]).not.to.be.undefined;
		return sendAsyncSpy.returnValues[0].then(() => {

			// After chapter1 response.
			expect(sendAsyncSpy.returnValues[1]).not.to.be.undefined;
			return sendAsyncSpy.returnValues[1].then(() => {
				expect(insertChapterSpy.lastCall.calledWith('chapter1')).to.be.true;

				// After chapter 2 response.
				expect(sendAsyncSpy.returnValues[2]).not.to.be.undefined;
				return sendAsyncSpy.returnValues[2].then(() => {
					expect(insertChapterSpy.lastCall.calledWith('chapter2')).to.be.true;

					// After chapter 3 response.
					expect(sendAsyncSpy.returnValues[3]).not.to.be.undefined;
					return sendAsyncSpy.returnValues[3].then(() => {
						expect(insertChapterSpy.lastCall.calledWith('chapter3')).to.be.true;
					});
				});
			});
		});
	});

	it('Should insert chapters in story order, even if received out of order', () => {
		XHRMock.get('story', (req, res) => {
			return res.status(200).body(JSON.stringify({
				title: 'My Story',
				chapters: ['chapter1', 'chapter2', 'chapter3']
			}));
		});

		var delays = {
			chapter3: 500,
			chapter1: 1000,
			chapter2: 1500
		};

		XHRMock.get(/^chapter/, (req, res) => {
			var query = req.url().query;
			var id = query && query.id;

			var response = res.status(200).body(JSON.stringify({
				id,
				text: ''
			}));

			return delay(response, delays[id]);
		});

		viewer = new StoryViewer();

		// Can't use Promise.all() as Promises are pushed serially.
		expect(sendAsyncSpy.returnValues[0]).not.to.be.undefined;
		return sendAsyncSpy.returnValues[0].then(() => {
			expect(sendAsyncSpy.returnValues[1]).not.to.be.undefined;
			return sendAsyncSpy.returnValues[1].then(() => {
				expect(sendAsyncSpy.returnValues[2]).not.to.be.undefined;
				return sendAsyncSpy.returnValues[2].then(() => {

					// After final chapter has been sent.
					expect(sendAsyncSpy.returnValues[3]).not.to.be.undefined;
					return sendAsyncSpy.returnValues[3].then(() => {
						expect(insertChapterSpy.callCount).to.equal(3);
						expect(insertChapterSpy.firstCall.calledWith('chapter1')).to.be.true;
						expect(insertChapterSpy.secondCall.calledWith('chapter2')).to.be.true;
						expect(insertChapterSpy.thirdCall.calledWith('chapter3')).to.be.true;
					});
				});
			});
		});
	});
});
