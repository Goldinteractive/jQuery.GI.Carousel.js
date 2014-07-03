module.exports = (grunt, options) =>
  all:
    options:
      urls: [
        'http://127.0.0.1:9999/test/tests.html'
      ]
      username: 'goldinteractive'
      key: 'be8a3f5a-9fde-48b5-bc4b-8f455320fee1'
      browsers: grunt.file.readJSON('test/saucelabs-browsers.json')
      build: process.env.TRAVIS_JOB_ID
      testname: 'jQuery.GI.Carousel.js'
      sauceConfig:
        'video-upload-on-pass': false


