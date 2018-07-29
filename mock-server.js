(function() {
	function delay(resolveWithValue, timeout) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve(resolveWithValue);
			}, timeout);
		});
	}

	var mock = XHRMock;

	mock.setup();
	
	mock.get('story', (req, res) => {
		var response = res
			.status(200)
			.body(JSON.stringify({
				title: 'My Story',
				chapters: ['chapter1', 'chapter2', 'chapter3', 'chapter4']
			}));

		return delay(response, Math.random() * 5000);
	});

	var chapters = {
		chapter1: '1. Humpty Dumpty sat on a wall,',
		chapter2: '2. Humpty Dumpty had a great fall;',
		chapter3: '3. All the king\'s horses and all the king\'s men',
		chapter4: '4. Couldn\'t put Humpty together again.' 
	};

	mock.get(/^chapter/, (req, res) => {
		var query = req.url().query;
		
		var id = query && query.id;

		var text = chapters[id];

		var response = res
			.status(200)
			.body(JSON.stringify({
				id,
				text
			}));

		return delay(response, Math.random() * 5000);
	});
})();
