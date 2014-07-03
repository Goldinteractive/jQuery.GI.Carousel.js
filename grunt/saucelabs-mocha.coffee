module.exports = (grunt, options) =>
  all:
    options:
      urls: [
        'http://127.0.0.1:9999/test/tests.html'
      ]
      username: 'GICarousel'
      key: '64d91d4b-dd70-4246-a525-a21ba43de737'
      browsers: grunt.file.readJSON('test/saucelabs-browsers.json')
      build: process.env.TRAVIS_JOB_ID
      testname: 'jQuery.GI.Carousel.js'
      sauceConfig:
        'video-upload-on-pass': false


