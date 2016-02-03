// Karma configuration
// Generated on Tue Jan 26 2016 17:16:11 GMT+0100 (CET)

module.exports = function(config) {
  var customLaunchers = {
    bs_firefox_mac: {
      base: 'BrowserStack',
      browser: 'firefox',
      browser_version: '21.0',
      os: 'OS X',
      os_version: 'Mountain Lion'
    },
    bs_iphone5: {
      base: 'BrowserStack',
      device: 'iPhone 5',
      browser: 'chrome',
      os: 'ios',
      os_version: '6.0'
    },
   /*
    sl_chrome: {
      base: 'SauceLabs',
      browserName: 'chrome',
      platform: 'Windows 7',
      version: '47'
    },
    sl_firefox: {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: '43'
    },
    sl_safari: {
      base: 'SauceLabs',
      browserName: 'safari',
      version: '9.0'
    },
    sl_ios_safari: {
      base: 'SauceLabs',
      browserName: 'iphone',
      platform: 'OS X 10.10',
      version: '9.0'
    },
    sl_ie_11: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 8.1',
      version: '11'
    }
    */
  };

  config.set({
    browserStack: {
      username: 'michaljourno1',
      accessKey: 'ypyenxjjyCAnPtNnCZ55'
    },
    sauceLabs: {
        testName: 'Redux Rails Library Tests'
    },
    customLaunchers: customLaunchers,
    browsers: Object.keys(customLaunchers),
    captureTimeout: 480000,
    browserNoActivityTimeout: 480000,
    browserNoActivityTimeout: 480000,
    browserDisconnectTimeout: 480000,

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha'],


    // list of files / patterns to load in the browser
    files: [
      'tests.webpack.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'tests.webpack.js': ['webpack', 'sourcemap']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'dots', 'saucelabs', 'mocha'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    // browsers: [],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    webpack: {
        devtool: 'inline-source-map',
        debug: true,
        // cache: true,
        // watchDelay: 800,
        resolve: {
            root: [__dirname]
        },
        module: {
            preLoaders: [
                {test: /\.js$/, exclude: /(node_modules|bower_components|test)\//, loader: 'isparta-instrumenter'},
            ],
            loaders: [
                {test: /(\.jsx)|(\.js)$/, exclude: /node_modules/, loader: 'babel'},
            ],
            postLoaders: [
            ],
        }
    },

    webpackServer: {
      noInfo: true
    },


    webpackMiddleware: {
      stats: {
        // With console colors
        colors: true,
        // add the hash of the compilation
        hash: false,
        // add webpack version information
        version: false,
        // add timing information
        timings: false,
        // add assets information
        assets: false,
        // add chunk information
        chunks: false,
        // add built modules information to chunk information
        chunkModules: false,
        // add built modules information
        modules: false,
        // add also information about cached (not built) modules
        cached: false,
        // add information about the reasons why modules are included
        reasons: false,
        // add the source code of modules
        source: false,
        // add details to errors (like resolving log)
        errorDetails: false,
        // add the origins of chunks and chunk merging info
        chunkOrigins: false,
        // Add messages from child loaders
        children: false
      }
    },
  })
}
