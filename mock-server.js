(function() {
	var mock = XHRMock;

	mock.setup();
	
	mock.get('document', (req, res) =>	res
		.status(200)
		.body(JSON.stringify({
			title: 'My Document',
			pages: ['page1', 'page2', 'page3', 'page4']
		}))
	);
})();