#!/usr/bin/env node

(() => {
	'use strict';
	var fs = require('fs');
	var path = require('path');
	var mkdirp = require('mkdirp').sync;
	var minimist = require('minimist');
	var glob = require('glob');
	var inline = require('../index.js');

	var args = minimist(process.argv.slice(2), {
		alias: {
			u: 'up',
			f: 'flatten',
			o: 'outDir',
			b: 'base',
			c: 'compress'
		},
		string: ['outDir', 'base'],
		boolean: ['flatten', 'compress'],
		number: ['up']
	});

	var globPath = args._.slice()[0];
	if (!globPath || typeof globPath === 'undefined' || globPath.length === 0) {
		doUsage();
	} else {
		glob(globPath, {}, (er, files) => {
			if (er) {
				console.error('failed to find files for path: ' + globPath);
				process.exit(1);
			} else {
				files.forEach((file) => {
					var target = path.join(process.cwd(), file);
					var content = fs.readFileSync(target);
					if (content) {
						content = inline(content.toString(), {
							base: args.base,
							compress: args.compress
						});

						if (args.flatten) {
							file = path.basename(file);
						} else if (typeof args.up === 'number') {
							var up = args.up;
							while (up > 0 && file.indexOf('/') >= 0) {
								file = file.substring(file.indexOf('/') + 1);
								up--;
							}
						}

						var destination = path.join(args.outDir, file);
						if (!fs.existsSync(path.dirname(destination))) {
							mkdirp(path.dirname(destination));
						}

						fs.writeFile(destination, content, err => {
							if (err) {
								console.error('error processing file: ' + file + ', produced error: ' + err);
							}
						});
					} else {
						console.error('failed to read target: ' + target);
					}
				});
			}
		});
	}

	function doUsage() {
		console.log('ng2-inline [--outDir|-o] [--base|-b] [--flatten|-f] [--up|-u <count>] <path glob>');
	}
})();
