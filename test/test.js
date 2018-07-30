describe('StoryViewer', () => {
	var expect = chai.expect;
	var openSpy;
	var sendSpy;

	var viewer;

	before(() => {
		XHRMock.setup();
		openSpy = sinon.spy(XMLHttpRequest.prototype, 'open');
		sendSpy = sinon.spy(XMLHttpRequest.prototype, 'send');
	});

	afterEach(() => {
		openSpy.resetHistory();
		sendSpy.resetHistory();
		viewer.reset();
	});

	after(() => {
		XHRMock.teardown();
		openSpy.restore();
		sendSpy.restore();
		
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
		expect(sendSpy.called).to.be.true;
	});
});
