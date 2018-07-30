describe('StoryViewer', () => {
	var expect = chai.expect;
	var openSpy;
	var sendAsyncSpy;

	var viewer;

	before(() => {
		XHRMock.setup();
		openSpy = sinon.spy(XMLHttpRequest.prototype, 'open');
		sendAsyncSpy = sinon.spy(XMLHttpRequest.prototype, 'sendAsync');
	});

	afterEach(() => {
		XHRMock.reset(); // Reset request handlers.
		openSpy.resetHistory();
		sendAsyncSpy.resetHistory();		
		viewer.reset();
	});

	after(() => {
		XHRMock.teardown();
		openSpy.restore();
		sendAsyncSpy.restore();		
	});

	it('Should immediately show loader', () => {
		var loader = document.getElementById('loader');

		expect(getComputedStyle(loader).visibility).to.equal('hidden');
		viewer = new StoryViewer();
		expect(getComputedStyle(loader).visibility).to.equal('visible');
	});

	it('Should immediately request story', () => {
		viewer = new StoryViewer();

		expect(openSpy.calledWith('get', 'story')).to.be.true;
		expect(sendAsyncSpy.called).to.be.true;
	});

	it('Should hide loader immediately when story is received', () => {
		XHRMock.get('story', (req, res) => {
			return res.status(200).body(JSON.stringify({
				title: 'My Story',
				chapters: []
			}));
		});

		viewer = new StoryViewer();

		// sendAsyncSpy() returns a Promise that resolves when the response has been sent.
		// Test is done() once Promise returned by then() resolves.
		return sendAsyncSpy.returnValues[0].then(() => {
			expect(getComputedStyle(loader).visibility).to.equal('hidden');
		});
	});
});
