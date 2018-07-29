describe('StoryViewer', () => {
	var expect = chai.expect;

	before(() => {
		XHRMock.setup();
	});

	after(() => {
		XHRMock.teardown();
	});

	it('Should immediately show loader', () => {
		var loader = document.getElementById('loader');

		expect(getComputedStyle(loader).visibility).to.equal('hidden');
		new StoryViewer();
		expect(getComputedStyle(loader).visibility).to.equal('visible');
	});

	it.skip('Should immediately request story', () => {
		mock.get('story', (req, res) => {
		});

		new StoryViewer();
	});
});
